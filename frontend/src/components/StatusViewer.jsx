import { useEffect, useState } from "react";
import API from "../api";

function StatusViewer({ list, currentUser, onClose, onDeleted }) {
  const [index, setIndex] = useState(0);

  const current = list?.[index];

  useEffect(() => {
    if (!current) return;

    API.put(`/status/view/${current._id}`).catch(() => {});

    const timer = setTimeout(() => {
      if (index < list.length - 1) {
        setIndex(index + 1);
      } else {
        onClose();
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [index, current?._id]);

  if (!current) return null;

  const isMyStatus = String(current.user._id) === String(currentUser._id);
  const isVideo = current.mediaType?.startsWith("video");

  const nextStatus = () => {
    if (index < list.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  const deleteStatus = async (e) => {
    e.stopPropagation();

    const ok = confirm("Delete this status?");
    if (!ok) return;

    try {
      await API.delete(`/status/${current._id}`);
      onDeleted(current._id);

      if (list.length === 1) {
        onClose();
      } else if (index >= list.length - 1) {
        setIndex(index - 1);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Delete status failed");
    }
  };

  return (
    <div className="status-viewer" onClick={nextStatus}>
      <div className="status-progress">
        {list.map((_, i) => (
          <span key={i} className={i <= index ? "active" : ""}></span>
        ))}
      </div>

      <div className="status-header">
        <img src={current.user.profilePic} alt={current.user.name} />

        <div>
          <h4>{current.user.name}</h4>
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
          ✕
        </button>
      </div>

      <div className="status-content">
        {current.mediaUrl ? (
          isVideo ? (
            <video className="status-media" src={current.mediaUrl} controls autoPlay />
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