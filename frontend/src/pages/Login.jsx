import { useState } from "react";
import API from "../api";

function Login() {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("jm382118@gmail.com");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearAlerts = () => {
    setError("");
    setMessage("");
  };

  const login = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      clearAlerts();

      const { data } = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (!data?.token) {
        setError("Token missing from backend");
        return;
      }

      localStorage.setItem("chatUser", JSON.stringify(data));
      window.location.replace("/home");
    } catch (error) {
      console.log("LOGIN ERROR:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      clearAlerts();

      const { data } = await API.post("/auth/forgot-password", {
        email: email.trim().toLowerCase()
      });

      setMessage(data.message || "OTP sent.");
      setMode("reset");
    } catch (error) {
      console.log("FORGOT ERROR:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      clearAlerts();

      const { data } = await API.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword.trim()
      });

      setMessage(data.message || "Password reset successful");
      setPassword("");
      setOtp("");
      setNewPassword("");
      setMode("login");
    } catch (error) {
      console.log("RESET ERROR:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={
          mode === "login" ? login : mode === "forgot" ? sendOtp : resetPassword
        }
      >
        <h1>
          {mode === "login"
            ? "Welcome Back"
            : mode === "forgot"
            ? "Forgot Password"
            : "Reset Password"}
        </h1>

        <p>
          {mode === "login"
            ? "Login to your private chat"
            : mode === "forgot"
            ? "Enter your registered email"
            : "Enter OTP and new password"}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <input
          type="email"
          placeholder="Registered email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        {mode === "login" && (
          <>
            <input
              type="password"
              placeholder="Password"
              value={password}
              required
              minLength="6"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Login"}
            </button>

            <button
              type="button"
              className="forgot-link-btn"
              onClick={() => {
                clearAlerts();
                setMode("forgot");
              }}
            >
              Forgot password?
            </button>

            <h4>
              New user? <a href="/register">Register</a>
            </h4>
          </>
        )}

        {mode === "forgot" && (
          <>
            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <button
              type="button"
              className="forgot-link-btn"
              onClick={() => {
                clearAlerts();
                setMode("login");
              }}
            >
              Back to login
            </button>
          </>
        )}

        {mode === "reset" && (
          <>
            <input
              type="text"
              placeholder="6 digit OTP"
              value={otp}
              required
              maxLength="6"
              onChange={(e) => setOtp(e.target.value)}
            />

            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              required
              minLength="6"
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              className="forgot-link-btn"
              onClick={() => {
                clearAlerts();
                setMode("forgot");
              }}
            >
              Resend OTP
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default Login;