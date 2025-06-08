// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GmStreak {
    address public owner;
    uint256 public constant CHECK_IN_PRICE = 0.00002 ether;
    uint256 public constant MIN_TIME_BETWEEN_CHECKINS = 23 hours;
    uint256 public constant MAX_TIME_BETWEEN_CHECKINS = 48 hours;
    uint256 public constant MAX_STREAK = 365; // Maximum possible streak
    uint256 public constant MAX_CHECKINS_PER_DAY = 1; // Maximum check-ins per day
    
    // Chainlink Time Oracle
    // AggregatorV3Interface internal timeOracle; // Удалено
    
    // User statistics structure
    struct UserStats {
        uint256 currentStreak;    // current streak
        uint256 totalCheckIns;    // total check-ins
        uint256 lastCheckIn;      // timestamp of last check-in
        uint256 longestStreak;    // longest streak
        bool isActive;            // user statusэ
        
    }
    
    // Safer storage: mapping(chainId => mapping(address => UserStats))
    mapping(uint256 => mapping(address => UserStats)) public userStatsByChain;
    
    // Track daily check-ins per user per chain
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public checkInsPerDay;
    
    // Events
    event CheckIn(
        address indexed user,
        uint256 indexed chainId,
        uint256 currentStreak,
        uint256 totalCheckIns,
        uint256 timestamp
    );
    event StreakUpdated(
        address indexed user,
        uint256 indexed chainId,
        uint256 oldStreak,
        uint256 newStreak
    );
    event Withdrawn(
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );
    // event TimeOracleUpdated( // Удалено
    //     address indexed oldOracle,
    //     address indexed newOracle,
    //     uint256 timestamp
    // );
    event UserStatusChanged(
        address indexed user,
        uint256 indexed chainId,
        bool newStatus,
        uint256 timestamp
    );
    event ErrorOccurred(
        address indexed user,
        string errorMessage,
        uint256 timestamp
    );
    
    constructor() { // Изменен конструктор
        owner = msg.sender;
        // timeOracle = AggregatorV3Interface(_timeOracle); // Удалено
    }
    
    // Owner only modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Get current timestamp from block.timestamp
    function getCurrentTime() public view returns (uint256) {
        // (, int256 timestamp,,,) = timeOracle.latestRoundData(); // Удалено
        // require(timestamp > 0, "Invalid timestamp from oracle"); // Удалено
        return block.timestamp; // Используем block.timestamp
    }
    
    // Get current day timestamp (start of day)
    function getCurrentDay() public view returns (uint256) {
        uint256 currentTime = getCurrentTime();
        return currentTime - (currentTime % 1 days);
    }
    
    // Update time oracle (owner only) // Удалено
    // function updateTimeOracle(address _newOracle) external onlyOwner {
    //     require(_newOracle != address(0), "Invalid oracle address");
    //     address oldOracle = address(timeOracle);
    //     timeOracle = AggregatorV3Interface(_newOracle);
    //     emit TimeOracleUpdated(oldOracle, _newOracle, getCurrentTime());
    // }
    
    // Function for daily check-in
    function checkIn(uint256 chainId) external payable {
        require(msg.value == CHECK_IN_PRICE, "Incorrect check-in price");
        
        UserStats storage stats = userStatsByChain[chainId][msg.sender];
        uint256 currentTime = getCurrentTime();
        uint256 currentDay = getCurrentDay();

        // Activate user if this is their first interaction
        if (!stats.isActive) {
            stats.isActive = true;
            emit UserStatusChanged(msg.sender, chainId, true, currentTime);
        }
        
        // Check daily limit
        require(
            checkInsPerDay[chainId][msg.sender][currentDay] < MAX_CHECKINS_PER_DAY,
            "Daily check-in limit reached"
        );
        
        // Check if this is the first check-in
        if (stats.lastCheckIn == 0) {
            stats.currentStreak = 1;
            stats.longestStreak = 1;
        } else {
            uint256 timeSinceLastCheckIn;
            // Safe subtraction with underflow check
            if (currentTime > stats.lastCheckIn) {
                timeSinceLastCheckIn = currentTime - stats.lastCheckIn;
            } else {
                revert("Invalid time sequence");
            }
            
            // Protection against time manipulation
            require(timeSinceLastCheckIn >= MIN_TIME_BETWEEN_CHECKINS, "Too early to check in");
            
            // If more than 48 hours passed, reset streak
            if (timeSinceLastCheckIn > MAX_TIME_BETWEEN_CHECKINS) {
                emit StreakUpdated(msg.sender, chainId, stats.currentStreak, 1);
                stats.currentStreak = 1;
            }
            // If between 23 and 48 hours passed, increase streak
            else if (timeSinceLastCheckIn >= MIN_TIME_BETWEEN_CHECKINS) {
                // Safe addition with overflow check
                if (stats.currentStreak < MAX_STREAK) {
                    uint256 oldStreak = stats.currentStreak;
                    stats.currentStreak++;
                    
                    // Update longest streak if needed
                    if (stats.currentStreak > stats.longestStreak) {
                        stats.longestStreak = stats.currentStreak;
                    }
                    
                    emit StreakUpdated(msg.sender, chainId, oldStreak, stats.currentStreak);
                }
            }
        }
        
        // Update statistics
        stats.lastCheckIn = currentTime;
        // Safe addition with overflow check
        stats.totalCheckIns++;
        checkInsPerDay[chainId][msg.sender][currentDay]++;
        
        emit CheckIn(msg.sender, chainId, stats.currentStreak, stats.totalCheckIns, currentTime);
    }
    
    // Get user statistics
    function getUserStats(address user, uint256 chainId) external view returns (
        uint256 currentStreak,
        uint256 totalCheckIns,
        uint256 lastCheckIn,
        uint256 longestStreak,
        bool isActive
    ) {
        UserStats storage stats = userStatsByChain[chainId][user];
        return (
            stats.currentStreak,
            stats.totalCheckIns,
            stats.lastCheckIn,
            stats.longestStreak,
            stats.isActive
        );
    }
    
    // Function to reset streak (owner only)
    function resetStreak(address user, uint256 chainId) external onlyOwner {
        UserStats storage stats = userStatsByChain[chainId][user];
        uint256 oldStreak = stats.currentStreak;
        stats.currentStreak = 0;
        emit StreakUpdated(user, chainId, oldStreak, 0);
    }
    
    // Function to update streak (owner only)
    function updateStreak(address user, uint256 chainId, uint256 newStreak) external onlyOwner {
        require(newStreak <= MAX_STREAK, "Streak exceeds maximum");
        UserStats storage stats = userStatsByChain[chainId][user];
        uint256 oldStreak = stats.currentStreak;
        stats.currentStreak = newStreak;
        if (newStreak > stats.longestStreak) {
            stats.longestStreak = newStreak;
        }
        emit StreakUpdated(user, chainId, oldStreak, newStreak);
    }
    
    // Function to set user status (owner only)
    function setUserStatus(address user, uint256 chainId, bool status) external onlyOwner {
        userStatsByChain[chainId][user].isActive = status;
        emit UserStatusChanged(user, chainId, status, getCurrentTime());
    }
    
    // Function to withdraw funds (owner only)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawn(owner, balance, getCurrentTime());
    }
    
    // Get contract balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Get check-in price
    function getCheckInPrice() external pure returns (uint256) {
        return CHECK_IN_PRICE;
    }
    
    // Receive function to accept ETH
    receive() external payable {}
} 