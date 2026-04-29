import { useState } from "react";
import API from "../api";

function ProfileModal({ currentUser, onClose }) {
  const [name, setName] = useState(currentUser.name);
  const [about, setAbout] = useState(currentUser.about || "");
  const [profilePic, setProfilePic] = useState(null);
  const [wallpaper, setWallpaper] = useState(null);
  const [preview, setPreview] = useState(currentUser.profilePic);
  const [wallpaperPreview, setWallpaperPreview] = useState(currentUser.wallpaper || "");
  const [loading, setLoading] = useState(false);

  const handleProfile = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleWallpaper = (e) => {
    const file = e.target.files[0];
    setWallpaper(file);
    if (file) setWallpaperPreview(URL.createObjectURL(file));
  };

  const updateProfile = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("about", about);

      if (profilePic) formData.append("profilePic", profilePic);
      if (wallpaper) formData.append("wallpaper", wallpaper);

      const { data } = await API.put("/profile/me", formData);

      const oldUser = JSON.parse(localStorage.getItem("chatUser"));

      localStorage.setItem(
        "chatUser",
        JSON.stringify({
          ...oldUser,
          name: data.name,
          profilePic: data.profilePic,
          about: data.about,
          wallpaper: data.wallpaper
        })
      );

      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="profile-modal">
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>Edit Profile</h2>

        <label className="profile-edit-dp">
          <img src={preview} alt="profile" />
          <span>Change DP</span>
          <input type="file" hidden accept="image/*" onChange={handleProfile} />
        </label>

        <input value={name} onChange={(e) => setName(e.target.value)} />

        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="About"
        />

        <label className="wallpaper-upload">
          <span>Change Chat Wallpaper</span>
          {wallpaperPreview && <img src={wallpaperPreview} alt="wallpaper" />}
          <input type="file" hidden accept="image/*" onChange={handleWallpaper} />
        </label>

        <button className="save-profile-btn" onClick={updateProfile} disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

export default ProfileModal;