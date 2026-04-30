import { useEffect, useRef, useState } from "react";
import Picker from "emoji-picker-react";
import {
  BsEmojiSmile,
  BsPaperclip,
  BsMicFill,
  BsStopFill,
  BsLockFill,
  BsCameraVideoFill,
  BsTelephoneFill,
} from "react-icons/bs";
import { MdArrowBackIosNew } from "react-icons/md";
import { IoSend } from "react-icons/io5";
import API from "../api";
import socket from "../socket";
import MessageBubble from "./MessageBubble";
import CallModal from "./CallModal";

function ChatBox({ selectedUser, setSelectedUser, currentUser, onlineUsers }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const [recording, setRecording] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [showCamera, setShowCamera] = useState(false);
  const [callData, setCallData] = useState(null);
  const [showCallHistory, setShowCallHistory] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const safeCurrentUser = currentUser || {};
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];

  const savedUser = JSON.parse(localStorage.getItem("chatUser") || "null");
  const chatWallpaper =
    safeCurrentUser?.wallpaper || savedUser?.wallpaper || "";

  const lockKey =
    selectedUser ? `chat_lock_${safeCurrentUser._id}_${selectedUser._id}` : "";

  const callHistoryKey = `call_history_${safeCurrentUser._id}`;
  const callHistoryPinKey = `call_history_pin_${safeCurrentUser._id}`;

  const [callHistory, setCallHistory] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(callHistoryKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  });
useEffect(() => {
  if (!safeCurrentUser?._id) return;

  const timer = setTimeout(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem(callHistoryKey) || "[]"
    );

    setCallHistory(Array.isArray(savedHistory) ? savedHistory : []);
  }, 0);

  return () => clearTimeout(timer);
}, [safeCurrentUser?._id, callHistoryKey]);

  const addCallHistory = (item) => {
    const newItem = {
      id: Date.now(),
      name: item.name || "Unknown",
      pic: item.pic || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      type: item.type || "audio",
      status: item.status || "Outgoing",
      durationSeconds: 0,
      durationText: "00:00",
      time: new Date().toISOString(),
    };

    const oldHistory = JSON.parse(localStorage.getItem(callHistoryKey) || "[]");
    const safeHistory = Array.isArray(oldHistory) ? oldHistory : [];
    const updated = [newItem, ...safeHistory];

    setCallHistory(updated);
    localStorage.setItem(callHistoryKey, JSON.stringify(updated));

    return newItem.id;
  };

  const updateCallHistory = (id, updates) => {
    const oldHistory = JSON.parse(localStorage.getItem(callHistoryKey) || "[]");
    const safeHistory = Array.isArray(oldHistory) ? oldHistory : [];

    const updated = safeHistory.map((call) =>
      call.id === id ? { ...call, ...updates } : call,
    );

    setCallHistory(updated);
    localStorage.setItem(callHistoryKey, JSON.stringify(updated));
  };

  const deleteCallHistory = (id) => {
    const updated = callHistory.filter((c) => c.id !== id);

    setCallHistory(updated);
    localStorage.setItem(callHistoryKey, JSON.stringify(updated));
  };

  const clearCallHistory = () => {
    const ok = confirm("Clear all call history?");
    if (!ok) return;

    setCallHistory([]);
    localStorage.removeItem(callHistoryKey);
  };

  const openCallHistorySecure = () => {
    const savedPin = localStorage.getItem(callHistoryPinKey);

    if (!savedPin) {
      const newPin = prompt("Set secret PIN for Call History:");

      if (!newPin || newPin.length < 4) {
        alert("Minimum 4 digit PIN required");
        return;
      }

      localStorage.setItem(callHistoryPinKey, newPin);
      setShowCallHistory(true);
      return;
    }

    const pin = prompt("Enter Call History PIN:");

    if (pin !== savedPin) {
      alert("Wrong PIN");
      return;
    }

    setShowCallHistory(true);
  };

  const resetCallHistoryPin = () => {
    const savedPin = localStorage.getItem(callHistoryPinKey);

    if (!savedPin) {
      alert("No PIN set");
      return;
    }

    const pin = prompt("Enter old PIN:");

    if (pin !== savedPin) {
      alert("Wrong PIN");
      return;
    }

    localStorage.removeItem(callHistoryPinKey);
    alert("Call history PIN removed");
  };

  useEffect(() => {
    if (!selectedUser) return;

    const timer = setTimeout(() => {
      const savedLock = localStorage.getItem(lockKey);
      setLocked(Boolean(savedLock));
      setPinInput("");
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedUser?._id, lockKey]);

  useEffect(() => {
    if (!selectedUser || !safeCurrentUser?._id || locked) return;

    const fetchMessages = async () => {
      try {
        const { data } = await API.get(`/messages/${selectedUser._id}`);

        setMessages(Array.isArray(data) ? data : []);

        await API.put(`/messages/read/${selectedUser._id}`);

        socket.emit("messageRead", {
          receiverId: selectedUser._id,
          readerId: safeCurrentUser._id,
        });
      } catch (error) {
        console.log(
          "Messages fetch error:",
          error.response?.data || error.message,
        );
        setMessages([]);
      }
    };

    fetchMessages();
  }, [selectedUser?._id, safeCurrentUser?._id, locked]);

  useEffect(() => {
    if (!safeCurrentUser?._id) return;

    const handleReceive = async (msg) => {
      if (msg.sender === selectedUser?._id && !locked) {
        setMessages((prev) => [...prev, msg]);

        try {
          await API.put(`/messages/read/${selectedUser._id}`);

          socket.emit("messageRead", {
            receiverId: selectedUser._id,
            readerId: safeCurrentUser._id,
          });
        } catch (error) {
          console.log("Read update error:", error);
        }
      }
    };

    const handleTyping = (senderId) => {
      if (senderId === selectedUser?._id) {
        setTyping(true);
      }
    };

    const handleStopTyping = (senderId) => {
      if (senderId === selectedUser?._id) {
        setTyping(false);
      }
    };

    const handleMessageRead = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === safeCurrentUser._id ? { ...m, isRead: true } : m,
        ),
      );
    };

    const handleMessageEdited = (editedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === editedMsg._id ? editedMsg : m)),
      );
    };

    const handleMessageDeletedEveryone = (deletedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === deletedMsg._id ? deletedMsg : m)),
      );
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageRead", handleMessageRead);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeletedEveryone", handleMessageDeletedEveryone);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageRead", handleMessageRead);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeletedEveryone", handleMessageDeletedEveryone);
    };
  }, [selectedUser?._id, safeCurrentUser?._id, locked]);

  useEffect(() => {
    const handleIncomingCall = (data) => {
      const historyId = addCallHistory({
        name: data.callerName,
        pic: data.callerPic,
        type: data.callType,
        status: "Incoming",
      });

      setCallData({
        incoming: true,
        peerId: data.from,
        callerName: data.callerName,
        callerPic: data.callerPic,
        callType: data.callType,
        offer: data.offer,
        historyId,
      });
    };

    socket.on("incomingCall", handleIncomingCall);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCurrentUser?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setChatLock = () => {
    if (!selectedUser) return;

    const pin = prompt("Set 4 digit PIN for this chat:");

    if (!pin || pin.length < 4) {
      alert("Minimum 4 digit PIN required");
      return;
    }

    localStorage.setItem(lockKey, pin);
    setLocked(true);
  };

  const removeChatLock = () => {
    const savedPin = localStorage.getItem(lockKey);
    const pin = prompt("Enter PIN to remove lock:");

    if (pin !== savedPin) {
      alert("Wrong PIN");
      return;
    }

    localStorage.removeItem(lockKey);
    setLocked(false);
  };

  const unlockChat = () => {
    const savedPin = localStorage.getItem(lockKey);

    if (pinInput !== savedPin) {
      alert("Wrong PIN");
      return;
    }

    setLocked(false);
  };

  const handleTypingChange = (e) => {
    setText(e.target.value);

    if (!selectedUser || !safeCurrentUser?._id) return;

    socket.emit("typing", {
      receiverId: selectedUser._id,
      senderId: safeCurrentUser._id,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", {
        receiverId: selectedUser._id,
        senderId: safeCurrentUser._id,
      });
    }, 700);
  };

  const editMessage = async (msg) => {
    if (msg.fileUrl) {
      alert("Only text messages can be edited");
      return;
    }

    const newText = prompt("Edit message:", msg.text);

    if (!newText || newText.trim() === msg.text) return;

    try {
      const { data } = await API.put(`/messages/edit/${msg._id}`, {
        text: newText,
      });

      setMessages((prev) => prev.map((m) => (m._id === msg._id ? data : m)));

      socket.emit("editMessage", data);
    } catch (error) {
      alert(error.response?.data?.message || "Edit failed");
    }
  };

  const deleteForMe = async (msg) => {
    try {
      await API.put(`/messages/delete-for-me/${msg._id}`);
      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const deleteForEveryone = async (msg) => {
    try {
      const { data } = await API.put(
        `/messages/delete-for-everyone/${msg._id}`,
      );

      setMessages((prev) => prev.map((m) => (m._id === msg._id ? data : m)));

      socket.emit("deleteMessageEveryone", data);
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const openCamera = async () => {
    try {
      setShowMenu(false);
      setShowCamera(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      cameraStreamRef.current = stream;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert("Camera permission denied");
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const photoFile = new File([blob], `camera-${Date.now()}.png`, {
        type: "image/png",
      });

      setFile(photoFile);
      closeCamera();
    }, "image/png");
  };

  const sendMessage = async (audioBlob = null) => {
    if (!selectedUser || !safeCurrentUser?._id || sending) return;
    if (!text.trim() && !file && !audioBlob) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMsg = {
      _id: tempId,
      sender: safeCurrentUser._id,
      receiver: selectedUser._id,
      text: audioBlob ? "" : text,
      fileUrl: file ? URL.createObjectURL(file) : "",
      fileType: audioBlob ? "audio/webm" : file?.type || "",
      isRead: false,
      createdAt: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    const oldText = text;
    const oldFile = file;

    setText("");
    setFile(null);
    setShowEmoji(false);
    setShowMenu(false);

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("receiver", selectedUser._id);
      formData.append("text", audioBlob ? "" : oldText);

      if (audioBlob) {
        formData.append("file", audioBlob, `voice-${Date.now()}.webm`);
      } else if (oldFile) {
        formData.append("file", oldFile);
      }

      const { data } = await API.post("/messages", formData);

      setMessages((prev) => prev.map((m) => (m._id === tempId ? data : m)));

      socket.emit("sendMessage", data);
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      alert(error.response?.data?.message || "Message send failed");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        stream.getTracks().forEach((track) => track.stop());
        sendMessage(audioBlob);
      };

      recorder.start();
      setRecording(true);
    } catch {
      alert("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const startAudioCall = () => {
    if (!selectedUser) return;

    const historyId = addCallHistory({
      name: selectedUser.name,
      pic: selectedUser.profilePic,
      type: "audio",
      status: "Outgoing",
    });

    setCallData({
      outgoing: true,
      peerId: selectedUser._id,
      callType: "audio",
      historyId,
    });
  };

  const startVideoCall = () => {
    if (!selectedUser) return;

    const historyId = addCallHistory({
      name: selectedUser.name,
      pic: selectedUser.profilePic,
      type: "video",
      status: "Outgoing",
    });

    setCallData({
      outgoing: true,
      peerId: selectedUser._id,
      callType: "video",
      historyId,
    });
  };

  if (!selectedUser) {
    return (
      <main className="empty-chat">
        <div className="empty-card">
          <div className="empty-logo">⚡</div>
          <h1>VibeTalk</h1>
          <p>Select a user and start private messaging.</p>
        </div>

        {callData && (
          <CallModal
            currentUser={safeCurrentUser}
            selectedUser={selectedUser}
            callData={callData}
            setCallData={setCallData}
            onCallFinish={updateCallHistory}
          />
        )}
      </main>
    );
  }

  if (locked) {
    return (
      <main className="chat-area">
        <header className="chat-header">
          <button
            className="mobile-back-btn premium-back-btn"
            onClick={() => setSelectedUser(null)}
            title="Back"
          >
            <MdArrowBackIosNew />
          </button>

          <img
            className="chat-header-avatar"
            src={
              selectedUser.profilePic ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt={selectedUser.name}
          />

          <div className="chat-header-info">
            <h3>{selectedUser.name}</h3>
            <p>Locked chat</p>
          </div>
        </header>

        <div className="lock-screen">
          <BsLockFill />
          <h2>This chat is locked</h2>

          <input
            type="password"
            placeholder="Enter PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlockChat()}
          />

          <button onClick={unlockChat}>Unlock Chat</button>
        </div>

        {callData && (
          <CallModal
            currentUser={safeCurrentUser}
            selectedUser={selectedUser}
            callData={callData}
            setCallData={setCallData}
            onCallFinish={updateCallHistory}
          />
        )}
      </main>
    );
  }

  return (
    <main className="chat-area">
      <header className="chat-header">
        <button
          className="mobile-back-btn"
          onClick={() => setSelectedUser(null)}
        >
          ←
        </button>

        <img
          className="chat-header-avatar"
          src={
            selectedUser.profilePic ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt={selectedUser.name}
        />

        <div className="chat-header-info">
          <h3>{selectedUser.name}</h3>

          <p>
            {typing ?
              "typing..."
            : safeOnlineUsers.includes(selectedUser._id) ?
              "Online"
            : selectedUser.lastSeen ?
              `Last seen ${new Date(selectedUser.lastSeen).toLocaleString()}`
            : "Offline"}
          </p>
        </div>

        <div className="chat-header-actions">
          <button onClick={startAudioCall} title="Audio call">
            <BsTelephoneFill />
          </button>

          <button onClick={startVideoCall} title="Video call">
            <BsCameraVideoFill />
          </button>

          <button onClick={openCallHistorySecure} title="Call history">
            History
          </button>

          <button onClick={setChatLock} title="Lock chat">
            Lock
          </button>

          {localStorage.getItem(lockKey) && (
            <button className="danger-action" onClick={removeChatLock}>
              Unlock
            </button>
          )}
        </div>
      </header>

      <section
        className="messages-area"
        style={
          chatWallpaper ?
            {
              background: `linear-gradient(rgba(11,20,26,0.72), rgba(11,20,26,0.72)), url("${chatWallpaper}") center / cover no-repeat`,
            }
          : undefined
        }
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            msg={msg}
            me={msg.sender === safeCurrentUser._id}
            onEdit={editMessage}
            onDeleteMe={deleteForMe}
            onDeleteEveryone={deleteForEveryone}
          />
        ))}

        <div ref={bottomRef}></div>
      </section>

      {showEmoji && (
        <div className="emoji-box">
          <Picker
            searchDisabled={false}
            onEmojiClick={(emoji) => setText((prev) => prev + emoji.emoji)}
          />
        </div>
      )}

      {showMenu && (
        <div className="attach-menu">
          <label>
            📄 Document
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                setFile(e.target.files[0]);
                setShowMenu(false);
              }}
            />
          </label>

          <label>
            🖼 Photos & videos
            <input
              type="file"
              hidden
              accept="image/*,video/*"
              onChange={(e) => {
                setFile(e.target.files[0]);
                setShowMenu(false);
              }}
            />
          </label>

          <button
            type="button"
            className="attach-menu-btn"
            onClick={openCamera}
          >
            📷 Camera
          </button>

          <label>
            🎵 Audio
            <input
              type="file"
              hidden
              accept="audio/*"
              onChange={(e) => {
                setFile(e.target.files[0]);
                setShowMenu(false);
              }}
            />
          </label>
        </div>
      )}

      {showCamera && (
        <div className="camera-modal">
          <div className="camera-box">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ transform: "scaleX(-1)" }}
            ></video>

            <div className="camera-actions">
              <button onClick={capturePhoto}>Capture</button>
              <button onClick={closeCamera} className="camera-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {file && (
        <div className="file-preview">
          <span>{file.name}</span>
          <button onClick={() => setFile(null)}>Remove</button>
        </div>
      )}

      {recording && (
        <div className="recording-bar">🎤 Recording... tap stop</div>
      )}

      <footer className="chat-input-area">
        <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}>
          <BsPaperclip />
        </button>

        <button className="icon-btn" onClick={() => setShowEmoji(!showEmoji)}>
          <BsEmojiSmile />
        </button>

        <input
          value={text}
          onChange={handleTypingChange}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={sending ? "Sending..." : "Type a message"}
          disabled={recording}
        />

        {text.trim() || file ?
          <button className="send-btn" onClick={() => sendMessage()}>
            <IoSend />
          </button>
        : recording ?
          <button className="send-btn stop-record" onClick={stopRecording}>
            <BsStopFill />
          </button>
        : <button className="send-btn mic-btn" onClick={startRecording}>
            <BsMicFill />
          </button>
        }
      </footer>

      {showCallHistory && (
        <div className="modal-overlay">
          <div className="profile-modal">
            <button
              className="modal-close"
              onClick={() => setShowCallHistory(false)}
            >
              ×
            </button>

            <h2>Call History</h2>

            <div className="call-history-list">
              {callHistory.length === 0 ?
                <p style={{ textAlign: "center", color: "#8696a0" }}>
                  No call history
                </p>
              : callHistory.map((call) => (
                  <div className="call-history-row" key={call.id}>
                    <img
                      src={
                        call.pic ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt={call.name}
                    />

                    <div>
                      <h4>{call.name}</h4>
                      <p>
                        {call.status} {call.type} call ·{" "}
                        {call.durationText || "00:00"}
                        <br />
                        {new Date(call.time).toLocaleString()}
                      </p>
                    </div>

                    <button onClick={() => deleteCallHistory(call.id)}>
                      Delete
                    </button>
                  </div>
                ))
              }
            </div>

            {callHistory.length > 0 && (
              <button className="save-profile-btn" onClick={clearCallHistory}>
                Clear All
              </button>
            )}

            <button
              className="save-profile-btn"
              style={{ marginTop: "10px", background: "#2a3942" }}
              onClick={resetCallHistoryPin}
            >
              Reset History PIN
            </button>
          </div>
        </div>
      )}

      {callData && (
        <CallModal
          currentUser={safeCurrentUser}
          selectedUser={selectedUser}
          callData={callData}
          setCallData={setCallData}
          onCallFinish={updateCallHistory}
        />
      )}
    </main>
  );
}

export default ChatBox;
