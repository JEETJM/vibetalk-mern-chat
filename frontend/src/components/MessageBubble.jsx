import { useState } from "react";
import { BsCheck2All, BsThreeDotsVertical } from "react-icons/bs";
import { FaFilePdf, FaFileAlt } from "react-icons/fa";

function MessageBubble({ msg, me, onEdit, onDeleteMe, onDeleteEveryone }) {
  const [open, setOpen] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const isImage = msg.fileType?.startsWith("image");
  const isAudio = msg.fileType?.startsWith("audio");
  const isPdf = msg.fileType?.includes("pdf");

  return (
    <>
      <div className={`message-row ${me ? "message-right" : "message-left"}`}>
        <div className={`message-bubble ${me ? "sent" : "received"}`}>
          <button className="message-menu-btn" onClick={() => setOpen(!open)}>
            <BsThreeDotsVertical />
          </button>

          {open && (
            <div className="message-menu">
              {me && !msg.fileUrl && !msg.deletedForEveryone && (
                <button onClick={() => onEdit(msg)}>Edit</button>
              )}

              <button onClick={() => onDeleteMe(msg)}>Delete for me</button>

              {me && (
                <button onClick={() => onDeleteEveryone(msg)}>
                  Delete for everyone
                </button>
              )}
            </div>
          )}

          {msg.deletedForEveryone ? (
            <p className="deleted-text">🚫 This message was deleted</p>
          ) : (
            <>
              {msg.fileUrl && isImage && (
                <img
                  className="message-image"
                  src={msg.fileUrl}
                  alt="uploaded"
                  onClick={() => setShowImage(true)}
                  style={{ cursor: "pointer" }}
                />
              )}

              {msg.fileUrl && isAudio && (
                <audio className="voice-player" controls src={msg.fileUrl}></audio>
              )}

              {msg.fileUrl && !isImage && !isAudio && (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="file-box"
                >
                  {isPdf ? <FaFilePdf /> : <FaFileAlt />}
                  <span>{isPdf ? "Open PDF" : "Open File"}</span>
                </a>
              )}

              {msg.text && <p className="message-text">{msg.text}</p>}
            </>
          )}

          <div className="message-meta">
            {msg.isEdited && <span>edited</span>}

            <span>
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>

            {me &&
              (msg.sending ? (
                <span className="sending-dot">sending</span>
              ) : (
                <BsCheck2All className={msg.isRead ? "tick read" : "tick"} />
              ))}
          </div>
        </div>
      </div>

      {showImage && (
        <div className="image-viewer" onClick={() => setShowImage(false)}>
          <button className="image-viewer-close">×</button>
          <img src={msg.fileUrl} alt="full view" />
        </div>
      )}
    </>
  );
}

export default MessageBubble;