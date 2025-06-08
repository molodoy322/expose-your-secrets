// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract AchievementNFT is ERC721, Ownable, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Цена минтинга NFT
    uint256 public constant MINT_PRICE = 0.001 ether;

    // Категории достижений
    enum Category {
        LIKE_MASTER,
        SECRET_CREATOR,
        POPULAR_SECRETS,
        DAILY_STREAK
    }

    // Уровни достижений
    enum Level {
        I,
        II,
        III,
        IV,
        V,
        VI,
        VII
    }

    // Структура для хранения информации о достижении
    struct Achievement {
        Category category;
        Level level;
        string title;
        string description;
        uint256 timestamp;
        uint256 requiredProgress;
    }

    // Маппинг токен ID -> информация о достижении
    mapping(uint256 => Achievement) public achievements;

    // Маппинг адрес -> маппинг категория -> маппинг уровень -> заминчено ли
    mapping(address => mapping(Category => mapping(Level => bool))) public hasMintedAchievement;

    // События
    event AchievementMinted(
        address indexed to,
        uint256 indexed tokenId,
        Category category,
        Level level,
        string title
    );

    event AchievementUpdated(
        uint256 indexed tokenId,
        string newTitle,
        string newDescription
    );

    constructor() ERC721("Expose Your Secrets Achievements", "EYSACH") Ownable(msg.sender) {}

    // Функция для минтинга NFT достижения
    function mintAchievement(
        address to,
        Category category,
        Level level,
        string memory title,
        string memory description,
        uint256 requiredProgress
    ) external payable whenNotPaused returns (uint256) {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(to != address(0), "Cannot mint to zero address");
        require(!hasMintedAchievement[to][category][level], "Achievement already minted");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        
        achievements[newTokenId] = Achievement({
            category: category,
            level: level,
            title: title,
            description: description,
            timestamp: block.timestamp,
            requiredProgress: requiredProgress
        });

        hasMintedAchievement[to][category][level] = true;

        emit AchievementMinted(to, newTokenId, category, level, title);

        return newTokenId;
    }

    // Функция для обновления метаданных достижения (только владелец)
    function updateAchievementMetadata(
        uint256 tokenId,
        string memory newTitle,
        string memory newDescription
    ) external onlyOwner whenNotPaused {
        require(_exists(tokenId), "Achievement does not exist");
        
        Achievement storage achievement = achievements[tokenId];
        achievement.title = newTitle;
        achievement.description = newDescription;
        
        emit AchievementUpdated(tokenId, newTitle, newDescription);
    }

    // Функция для проверки, заминчено ли достижение
    function hasMinted(
        address user,
        Category category,
        Level level
    ) external view returns (bool) {
        return hasMintedAchievement[user][category][level];
    }

    // Функция для получения информации о достижении
    function getAchievement(uint256 tokenId) external view returns (
        Category category,
        Level level,
        string memory title,
        string memory description,
        uint256 timestamp,
        uint256 requiredProgress
    ) {
        require(_exists(tokenId), "Achievement does not exist");
        Achievement memory achievement = achievements[tokenId];
        return (
            achievement.category,
            achievement.level,
            achievement.title,
            achievement.description,
            achievement.timestamp,
            achievement.requiredProgress
        );
    }

    // Функция для вывода средств (только владелец)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // Функция для паузы контракта (только владелец)
    function pause() external onlyOwner {
        _pause();
    }

    // Функция для возобновления работы контракта (только владелец)
    function unpause() external onlyOwner {
        _unpause();
    }

    // Переопределение функции _exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
} 