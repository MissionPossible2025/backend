import { useState } from "react";
import axios from "axios";

export default function LoginPage({ setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      // Ensure we always hit the backend prefix `/api`, even if VITE_API_URL is only `http://host:port`.
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const apiUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

      const loginUrl = `${apiUrl}/users/login`;
      
      console.log('Attempting login to:', loginUrl);
      console.log('Environment variable VITE_API_URL:', import.meta.env.VITE_API_URL);
      
      const res =await axios({
        method: "post",
        url: loginUrl,
        data: { email: email.trim().toLowerCase(), password },
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Save token (optional)
      localStorage.setItem("token", res.data.token);

      alert("Login successful!");
      setLoggedIn(res.data.user);
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      
      let errorMessage = "Login failed: ";
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMessage += `Network error - Cannot reach server at ${err.config?.url || 'the API URL'}. Please check if the backend server is running and accessible.`;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else {
        errorMessage += err.message;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      maxWidth: "100%",
      margin: 0,
      padding: "1rem",
      boxSizing: "border-box"
    }}>
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: "clamp(1rem, 4vw, 2rem)",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h1 style={{ marginBottom: "2rem", fontSize: "clamp(1.5rem, 5vw, 2rem)", textAlign: "center" }}>Seller Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ 
            width: "100%",
            display: "block", 
            marginBottom: "1rem", 
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "16px",
            boxSizing: "border-box"
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ 
            width: "100%",
            display: "block", 
            marginBottom: "1.5rem", 
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "16px",
            boxSizing: "border-box"
          }}
        />
        <button 
          onClick={handleLogin} 
          style={{ 
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#535bf2"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#646cff"}
        >
          Login
        </button>
      </div>
    </div>
  );
}

