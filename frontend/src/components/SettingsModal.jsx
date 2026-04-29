import { useState } from "react";
import API from "../api";

function SettingsModal({ currentUser, onClose }) {
  const [enabled, setEnabled] = useState(currentUser.chatLocked || false);
  const [pin, setPin] = useState("");

  const saveLock = async () => {
    try {
      const { data } = await API.put("/profile/chat-lock", {
        enabled,
        pin
      });

      const oldUser = JSON.parse(localStorage.getItem("chatUser"));

      localStorage.setItem(
        "chatUser",
        JSON.stringify({
          ...oldUser,
          chatLocked: data.chatLocked
        })
      );

      alert("Settings saved");
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Settings save failed");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="profile-modal">
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>Settings</h2>

        <div className="setting-row">
          <div>
            <h3>Chat Lock</h3>
            <p>Lock your chat screen with PIN</p>
          </div>

          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </div>

        {enabled && (
          <input
            type="password"
            placeholder="Enter 4 digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        )}

        <button className="save-profile-btn" onClick={saveLock}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default SettingsModal;