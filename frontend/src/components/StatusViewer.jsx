import { useEffect, useState } from "react";
import API from "../api";

function StatusViewer({ list, currentUser, onClose, onDeleted }) {
  const [index, setIndex] = useState(0);

  const safeList = Array.isArray(list) ? list : [];
  const current = safeList[index];

  useEffect(() => {
    if (!current?._id) return;

    API.put(`/status/view/${current._id}`).catch(() => {});

    const timer = setTimeout(() => {
      if (index < safeList.length - 1) {
        setIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [current?._id, index, safeList.length, onClose]);

  if (!current) return null;

  const isMyStatus = String(current.user?._id) === String(currentUser?._id);
  const isVideo = current.mediaType?.startsWith("video");

  const nextStatus = () => {
    if (index < safeList.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStatus = (e) => {
    e.stopPropagation();

    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  const deleteStatus = async (e) => {
    e.stopPropagation();

    const ok = confirm("Delete this status?");
    if (!ok) return;

    try {
      await API.delete(`/status/${current._id}`);

      onDeleted(current._id);

      if (safeList.length === 1) {
        onClose();
      } else if (index >= safeList.length - 1) {
        setIndex((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Delete status failed");
    }
  };

  return (
    <div className="status-viewer" onClick={nextStatus}>
      <div className="status-progress">
        {safeList.map((_, i) => (
          <span key={i} className={i <= index ? "active" : ""}></span>
        ))}
      </div>

      <div className="status-header">
        <img
          src={
            current.user?.profilePic ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt={current.user?.name || "user"}
        />

        <div>
          <h4>{current.user?.name || "User"}</h4>
          <p>
            {new Date(current.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>

        {isMyStatus && (
          <button className="status-delete-btn" onClick={deleteStatus}>
            Delete
          </button>
        )}

        <button
          className="status-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ×
        </button>
      </div>

      <button className="status-prev-zone" onClick={prevStatus}></button>

      <div className="status-content">
        {current.mediaUrl ? (
          isVideo ? (
            <video
              className="status-media"
              src={current.mediaUrl}
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img className="status-media" src={current.mediaUrl} alt="status" />
          )
        ) : (
          <div className="status-text">{current.text}</div>
        )}

        {current.text && current.mediaUrl && (
          <div className="status-caption">{current.text}</div>
        )}
      </div>
    </div>
  );
}

export default StatusViewer;