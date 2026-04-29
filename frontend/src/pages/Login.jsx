import { useState } from "react";
import API from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const { data } = await API.post("/auth/login", {
        email,
        password
      });

      console.log("LOGIN DATA:", data);

      if (!data?.token) {
        setError("Token missing from backend");
        return;
      }

      localStorage.setItem("chatUser", JSON.stringify(data));

      window.location.href = "/home";
    } catch (error) {
      console.log("LOGIN ERROR:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={login}>
        <h1>Welcome Back</h1>
        <p>Login to your private chat</p>

        {error && <div className="auth-error">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

        <h4>
          New user? <a href="/register">Register</a>
        </h4>
      </form>
    </div>
  );
}

export default Login;