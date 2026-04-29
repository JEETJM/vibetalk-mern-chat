import { useEffect, useRef, useState } from "react";
import ProfileModal from "./ProfileModal";
import StatusViewer from "./StatusViewer";
import API from "../api";

function Sidebar({
  users,
  selectedUser,
  setSelectedUser,
  onlineUsers,
  currentUser,
  unreadCounts
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [openStatus, setOpenStatus] = useState(null);

  const [showStatusCamera, setShowStatusCamera] = useState(false);
  const statusVideoRef = useRef(null);
  const statusCameraStreamRef = useRef(null);

  const logout = () => {
    localStorage.removeItem("chatUser");
    window.location.href = "/";
  };

  const fetchStatuses = async () => {
    try {
      const { data } = await API.get("/status");
      setStatuses(data);
    } catch (error) {
      console.log("Status fetch error:", error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const uploadStatus = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const text = prompt("Caption optional:");
      const form = new FormData();

      form.append("file", file);
      if (text) form.append("text", text);

      const { data } = await API.post("/status", form);
      setStatuses((prev) => [data, ...prev]);
      e.target.value = "";
    } catch (error) {
      alert(error.response?.data?.message || "Status upload failed");
    }
  };

  const createTextStatus = async () => {
    try {
      const text = prompt("Write your text status:");
      if (!text || !text.trim()) return;

      const form = new FormData();
      form.append("text", text);

      const { data } = await API.post("/status", form);
      setStatuses((prev) => [data, ...prev]);
    } catch (error) {
      alert(error.response?.data?.message || "Text status failed");
    }
  };

  const openStatusCamera = async () => {
    try {
      setShowStatusCamera(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      statusCameraStreamRef.current = stream;

      setTimeout(() => {
        if (statusVideoRef.current) {
          statusVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert("Camera permission denied");
      setShowStatusCamera(false);
    }
  };

  const closeStatusCamera = () => {
    statusCameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    setShowStatusCamera(false);
  };

  const captureStatusPhoto = () => {
    const video = statusVideoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const file = new File([blob], `status-camera-${Date.now()}.png`, {
          type: "image/png"
        });

        const text = prompt("Caption optional:");
        const form = new FormData();

        form.append("file", file);
        if (text) form.append("text", text);

        const { data } = await API.post("/status", form);
        setStatuses((prev) => [data, ...prev]);

        closeStatusCamera();
      } catch (error) {
        alert(error.response?.data?.message || "Status camera upload failed");
      }
    }, "image/png");
  };

  const grouped = statuses.reduce((acc, status) => {
    const userId = String(status.user._id);
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(status);
    return acc;
  }, {});

  const myStatuses = grouped[String(currentUser._id)] || [];

  const otherStatusGroups = Object.values(grouped).filter(
    (list) => String(list[0].user._id) !== String(currentUser._id)
  );

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="my-profile" onClick={() => setShowProfile(true)}>
            <img src={currentUser.profilePic} alt="me" />
            <div>
              <h3>{currentUser.name}</h3>
              <p>Click to edit profile</p>
            </div>
          </div>

          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="brand-box">
          <div>
            <h2>⚡ VibeTalk</h2>
            <p>Private secure chat</p>
          </div>

          <div className="status-actions">
            <label className="status-upload-btn">
              🖼
              <input
                type="file"
                hidden
                accept="image/*,video/*"
                onChange={uploadStatus}
              />
            </label>

            <button className="text-status-btn" onClick={openStatusCamera}>
              📷
            </button>

            <button className="text-status-btn" onClick={createTextStatus}>
              ✍
            </button>
          </div>
        </div>

        <div className="status-strip">
          <div
            className={`mini-status ${myStatuses.length > 0 ? "has-status" : ""}`}
            onClick={() => {
              if (myStatuses.length > 0) setOpenStatus(myStatuses);
              else createTextStatus();
            }}
          >
            <div className="status-avatar-wrap">
              <img src={currentUser.profilePic} alt="my status" />
              <b>+</b>
            </div>
            <span>My Status</span>
          </div>

          {otherStatusGroups.map((list) => {
            const user = list[0].user;

            return (
              <div
                key={user._id}
                className="mini-status has-status"
                onClick={() => setOpenStatus(list)}
              >
                <div className="status-avatar-wrap">
                  <img src={user.profilePic} alt={user.name} />
                </div>
                <span>{user.name}</span>
              </div>
            );
          })}
        </div>

        <div className="search-box">
          <input
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="chat-list">
          {filteredUsers.map((user) => {
            const count = unreadCounts?.[String(user._id)] || 0;

            return (
              <div
                key={user._id}
                className={`chat-user ${
                  selectedUser?._id === user._id ? "active" : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="avatar-wrap">
                  <img src={user.profilePic} alt={user.name} />

                  {onlineUsers.includes(user._id) && (
                    <span className="online-dot"></span>
                  )}
                </div>

                <div className="chat-user-info">
                  <div className="chat-user-row">
                    <h4>{user.name}</h4>

                    {user.lastMessage?.time && (
                      <span className="msg-time">
                        {new Date(user.lastMessage.time).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    )}

                    {count > 0 ? (
                      <b className="unread-badge">{count}</b>
                    ) : (
                      <span>
                        {onlineUsers.includes(user._id) ? "online" : "offline"}
                      </span>
                    )}
                  </div>

                  <p
                    className={
                      count > 0 ? "last-message unread-text" : "last-message"
                    }
                  >
                    {user.lastMessage?.text
                      ? user.lastMessage.text.length > 35
                        ? user.lastMessage.text.slice(0, 35) + "..."
                        : user.lastMessage.text
                      : onlineUsers.includes(user._id)
                      ? "Available now"
                      : user.lastSeen
                      ? `Last seen ${new Date(user.lastSeen).toLocaleString()}`
                      : "Offline"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {showProfile && (
        <ProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfile(false)}
        />
      )}

      {openStatus && (
        <StatusViewer
          list={openStatus}
          currentUser={currentUser}
          onClose={() => setOpenStatus(null)}
          onDeleted={(deletedId) => {
            setStatuses((prev) => prev.filter((s) => s._id !== deletedId));
            setOpenStatus((prev) => prev.filter((s) => s._id !== deletedId));
          }}
        />
      )}

      {showStatusCamera && (
        <div className="camera-modal">
          <div className="camera-box">
            <video
              ref={statusVideoRef}
              autoPlay
              playsInline
              style={{ transform: "scaleX(-1)" }}
            ></video>

            <div className="camera-actions">
              <button onClick={captureStatusPhoto}>Capture Status</button>
              <button onClick={closeStatusCamera} className="camera-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;