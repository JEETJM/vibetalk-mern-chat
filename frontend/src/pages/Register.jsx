import { useState } from "react";
import API from "../api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(
    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  );

  const [error, setError] = useState("");

  const handlePic = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const register = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      if (profilePic) {
        formData.append("profilePic", profilePic);
      }

      const { data } = await API.post("/auth/register", formData);

      console.log("REGISTER DATA:", data);

      if (!data?.token) {
        setError("Token missing from backend");
        return;
      }

      localStorage.setItem("chatUser", JSON.stringify(data));

      window.location.href = "/home";
    } catch (error) {
      console.log("REGISTER ERROR:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={register}>
        <h1>Join Chat</h1>
        <p>Create your WhatsApp-style account</p>

        <label className="dp-upload">
          <img src={preview} alt="dp" />
          <span>Upload DP</span>
          <input type="file" hidden accept="image/*" onChange={handlePic} />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <input
          type="text"
          placeholder="Name"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />

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
          minLength="6"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Create Account</button>

        <h4>
          Already have account? <a href="/login">Login</a>
        </h4>
      </form>
    </div>
  );
}

export default Register;