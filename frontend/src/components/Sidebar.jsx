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

  const safeCurrentUser = currentUser || {};
  const safeUsers = Array.isArray(users) ? users : [];
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];
  const safeUnreadCounts = unreadCounts || {};
  const safeStatuses = Array.isArray(statuses) ? statuses : [];

  const logout = () => {
    localStorage.removeItem("chatUser");
    window.location.href = "/";
  };

  const fetchStatuses = async () => {
    try {
      const { data } = await API.get("/status");

      if (Array.isArray(data)) {
        setStatuses(data);
      } else {
        console.log("Status data is not array:", data);
        setStatuses([]);
      }
    } catch (error) {
      console.log("Status fetch error:", error);
      setStatuses([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStatuses();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const uploadStatus = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = prompt("Caption optional:");
      const form = new FormData();

      form.append("file", file);
      if (text) form.append("text", text);

      const { data } = await API.post("/status", form);

      if (data && data.user) {
        setStatuses((prev) => [data, ...(Array.isArray(prev) ? prev : [])]);
      }

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
      form.append("text", text.trim());

      const { data } = await API.post("/status", form);

      if (data && data.user) {
        setStatuses((prev) => [data, ...(Array.isArray(prev) ? prev : [])]);
      }
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
    statusCameraStreamRef.current = null;
    setShowStatusCamera(false);
  };

  const captureStatusPhoto = () => {
    const video = statusVideoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

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

        if (data && data.user) {
          setStatuses((prev) => [data, ...(Array.isArray(prev) ? prev : [])]);
        }

        closeStatusCamera();
      } catch (error) {
        alert(error.response?.data?.message || "Status camera upload failed");
      }
    }, "image/png");
  };

  const grouped = safeStatuses.reduce((acc, status) => {
    if (!status?.user?._id) return acc;

    const userId = String(status.user._id);

    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(status);

    return acc;
  }, {});

  const myStatuses = grouped[String(safeCurrentUser._id)] || [];

  const otherStatusGroups = Object.values(grouped).filter(
    (list) => String(list?.[0]?.user?._id) !== String(safeCurrentUser._id)
  );

  const filteredUsers = safeUsers.filter((user) =>
    (user?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="my-profile" onClick={() => setShowProfile(true)}>
            <img
              src={
                safeCurrentUser.profilePic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="me"
            />

            <div>
              <h3>{safeCurrentUser.name || "My Account"}</h3>
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
            <label className="status-upload-btn" title="Upload status">
              🖼
              <input
                type="file"
                hidden
                accept="image/*,video/*"
                onChange={uploadStatus}
              />
            </label>

            <button
              className="text-status-btn"
              onClick={openStatusCamera}
              title="Camera status"
            >
              📷
            </button>

            <button
              className="text-status-btn"
              onClick={createTextStatus}
              title="Text status"
            >
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
              <img
                src={
                  safeCurrentUser.profilePic ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="my status"
              />
              <b>+</b>
            </div>
            <span>My Status</span>
          </div>

          {otherStatusGroups.map((list) => {
            const user = list?.[0]?.user;
            if (!user?._id) return null;

            return (
              <div
                key={user._id}
                className="mini-status has-status"
                onClick={() => setOpenStatus(list)}
              >
                <div className="status-avatar-wrap">
                  <img
                    src={
                      user.profilePic ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt={user.name || "user"}
                  />
                </div>
                <span>{user.name || "User"}</span>
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
            const count = safeUnreadCounts?.[String(user._id)] || 0;

            return (
              <div
                key={user._id}
                className={`chat-user ${
                  selectedUser?._id === user._id ? "active" : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="avatar-wrap">
                  <img
                    src={
                      user.profilePic ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt={user.name || "user"}
                  />

                  {safeOnlineUsers.includes(user._id) && (
                    <span className="online-dot"></span>
                  )}
                </div>

                <div className="chat-user-info">
                  <div className="chat-user-row">
                    <h4>{user.name || "User"}</h4>

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
                        {safeOnlineUsers.includes(user._id) ? "online" : "offline"}
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
                      : safeOnlineUsers.includes(user._id)
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
          currentUser={safeCurrentUser}
          onClose={() => setShowProfile(false)}
        />
      )}

      {openStatus && (
        <StatusViewer
          list={openStatus}
          currentUser={safeCurrentUser}
          onClose={() => setOpenStatus(null)}
          onDeleted={(deletedId) => {
            setStatuses((prev) =>
              (Array.isArray(prev) ? prev : []).filter((s) => s._id !== deletedId)
            );

            setOpenStatus((prev) => {
              const updated = (Array.isArray(prev) ? prev : []).filter(
                (s) => s._id !== deletedId
              );

              return updated.length > 0 ? updated : null;
            });
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