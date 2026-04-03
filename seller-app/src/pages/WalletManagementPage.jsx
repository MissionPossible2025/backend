import { useNavigate } from "react-router-dom";
import WalletManagement from "../components/WalletManagement.jsx";

export default function WalletManagementPage({ user }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        margin: 0,
        padding: "clamp(0.5rem, 2vw, 1rem)",
        boxSizing: "border-box",
        overflowX: "hidden"
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: "clamp(1rem, 3vw, 2rem)",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "900px",
          textAlign: "left",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
            gap: "0.75rem",
            flexWrap: "wrap"
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(1.5rem, 5vw, 2rem)", wordBreak: "break-word" }}>
              Wallet Management
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#64748b" }}>
              Configure cashback slabs for your customers.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: "pointer",
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              border: "1px solid #cbd5e1"
            }}
          >
            Back to Dashboard
          </button>
        </div>

        <WalletManagement sellerId={user?._id} />
      </div>
    </div>
  );
}

