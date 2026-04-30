import { useState } from "react";
import API from "../api";

function ProfileModal({ currentUser, onClose }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [about, setAbout] = useState(currentUser?.about || "");

  const [profilePic, setProfilePic] = useState(null);
  const [wallpaper, setWallpaper] = useState(null);

  const [profilePreview, setProfilePreview] = useState(
    currentUser?.profilePic ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  );

  const [wallpaperPreview, setWallpaperPreview] = useState(
    currentUser?.wallpaper || ""
  );

  const [loading, setLoading] = useState(false);

  const handleProfilePic = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfilePic(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleWallpaper = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setWallpaper(file);
    setWallpaperPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", name);
      formData.append("about", about);

      if (profilePic) {
        formData.append("profilePic", profilePic);
      }

      if (wallpaper) {
        formData.append("wallpaper", wallpaper);
      }

      const { data } = await API.put("/profile/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      localStorage.setItem("chatUser", JSON.stringify(data));

      alert("Profile updated successfully");

      window.location.reload();
    } catch (error) {
      console.log("PROFILE UPDATE FRONTEND ERROR:", error.response?.data || error);
      alert(error.response?.data?.message || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="profile-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>Edit Profile</h2>

        <label className="profile-edit-dp">
          <img src={profilePreview} alt="profile" />
          <span>Change DP</span>
          <input type="file" hidden accept="image/*" onChange={handleProfilePic} />
        </label>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="About"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        ></textarea>

        <label className="wallpaper-upload">
          <span>Change Chat Wallpaper</span>

          {wallpaperPreview ? (
            <img src={wallpaperPreview} alt="wallpaper preview" />
          ) : (
            <div
              style={{
                height: "120px",
                borderRadius: "12px",
                background: "#111b21",
                display: "grid",
                placeItems: "center",
                color: "#8696a0"
              }}
            >
              No wallpaper selected
            </div>
          )}

          <input type="file" hidden accept="image/*" onChange={handleWallpaper} />
        </label>

        <button
          className="save-profile-btn"
          onClick={saveProfile}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

export default ProfileModal;