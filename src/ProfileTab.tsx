import { CONTRACT_ADDRESS, ABI } from "./lib/contract";
import { encodeFunctionData } from "viem";

interface ProfileTabProps {
  address: string | undefined;
  mySecrets: any[];
  cardStyle: any;
  fetchSecrets?: () => void; // треба для оновлення після видалення
}

export default function ProfileTab({ address, mySecrets, cardStyle, fetchSecrets }: ProfileTabProps) {
  async function handleDeleteSecret(id: number) {
    if (!window.ethereum) return alert("No wallet found!");
    if (!window.confirm("Delete this secret forever?")) return;
    try {
      const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: ABI,
            functionName: "deleteSecret",
            args: [id],
          }),
        }],
      });
      alert("Secret deleted!");
      fetchSecrets && fetchSecrets();
    } catch (e: any) {
      alert("Error deleting secret! " + (e?.message || ""));
    }
  }

  return (
    <div style={{
      maxWidth: 520,
      margin: "60px auto 0 auto",
      padding: "40px 22px 30px 22px",
      background: "rgba(36, 37, 58, 0.54)",
      borderRadius: 26,
      border: "1.8px solid #21EF6E",
      boxShadow: "0 0 32px 0 #21ef6e22",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)"
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>👤 Your Profile</div>
      <div style={{ color: "#FF2D55", fontWeight: 600, fontSize: 17, marginBottom: 10 }}>
        {address ? `Wallet: ${address.slice(0, 8)}...${address.slice(-6)}` : ""}
      </div>
      <div style={{ marginBottom: 24, fontSize: 18, color: "#f2f2f2" }}>
        Secrets posted: <span style={{ color: "#21EF6E", fontWeight: 700 }}>{mySecrets.length}</span>
        <br />
        Total likes: <span style={{ color: "#FFD600", fontWeight: 700 }}>
          {mySecrets.reduce((sum, s) => sum + Number(s.likes), 0)}
        </span>
      </div>
      <hr style={{
        margin: "25px 0",
        border: "none",
        height: 2,
        background: "linear-gradient(90deg, #21EF6E 0%, #FF2D55 100%)",
        borderRadius: 6
      }} />
      <div style={{ fontSize: 17, marginBottom: 16, fontWeight: 600, color: "#21EF6E" }}>Your secrets:</div>
      {mySecrets.length === 0 && <div style={{ color: "#888" }}>You haven't posted any secrets yet!</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {mySecrets.map(s => (
          <li key={s.id} style={{
            ...cardStyle,
            background: "linear-gradient(120deg, #23243a 50%, #1a1b22 100%)",
            marginBottom: 16
          }}>
            <div style={{ fontSize: 17, color: "#fff", fontStyle: "italic", marginBottom: 8 }}>{s.text}</div>
            <div style={{ fontSize: 15, color: "#FFD600", fontWeight: 700 }}>
              ❤️ {Number(s.likes)} likes
            </div>
            <button
              style={{
                marginTop: 10,
                padding: "7px 22px",
                borderRadius: 9,
                background: "#FF2D55",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: "pointer"
              }}
              onClick={() => handleDeleteSecret(s.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
