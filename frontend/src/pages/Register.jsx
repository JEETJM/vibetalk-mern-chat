import { useState } from "react";
import API from "../api";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  const handleImage = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);

      if (profilePic) {
        formData.append("profilePic", profilePic);
      }

      const { data } = await API.post("/auth/register", formData);

      localStorage.setItem("chatUser", JSON.stringify(data));
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submitHandler}>
        <h1>Join Chat</h1>
        <p>Create your WhatsApp-style account</p>

        <label className="dp-upload">
          <img
            src={preview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="dp"
          />
          <span>Upload DP</span>
          <input type="file" accept="image/*" hidden onChange={handleImage} />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <input
          type="text"
          placeholder="Full name"
          required
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="email"
          placeholder="Email address"
          required
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          required
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button>Create Account</button>

        <h4>
          Already have account? <a href="/login">Login</a>
        </h4>
      </form>
    </div>
  );
}

export default Register;