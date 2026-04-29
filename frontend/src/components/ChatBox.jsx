import { useEffect, useRef, useState } from "react";
import Picker from "emoji-picker-react";
import {
  BsEmojiSmile,
  BsPaperclip,
  BsMicFill,
  BsStopFill,
  BsLockFill,
  BsCameraVideoFill,
  BsTelephoneFill
} from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import API from "../api";
import socket from "../socket";
import MessageBubble from "./MessageBubble";
import CallModal from "./CallModal";

function ChatBox({ selectedUser, currentUser, onlineUsers }) {
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
  const [callHistory, setCallHistory] = useState(
    JSON.parse(localStorage.getItem(`call_history_${currentUser._id}`)) || []
  );

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const savedUser = JSON.parse(localStorage.getItem("chatUser"));
  const chatWallpaper = currentUser?.wallpaper || savedUser?.wallpaper || "";

  const lockKey = selectedUser
    ? `chat_lock_${currentUser._id}_${selectedUser._id}`
    : "";

  const addCallHistory = (item) => {
    const newItem = {
      id: Date.now(),
      name: item.name,
      pic: item.pic,
      type: item.type,
      status: item.status,
      time: new Date().toISOString()
    };

    const updated = [newItem, ...callHistory];

    setCallHistory(updated);
    localStorage.setItem(
      `call_history_${currentUser._id}`,
      JSON.stringify(updated)
    );
  };

  const deleteCallHistory = (id) => {
    const updated = callHistory.filter((c) => c.id !== id);
    setCallHistory(updated);
    localStorage.setItem(
      `call_history_${currentUser._id}`,
      JSON.stringify(updated)
    );
  };

  const clearCallHistory = () => {
    setCallHistory([]);
    localStorage.removeItem(`call_history_${currentUser._id}`);
  };

  useEffect(() => {
    if (!selectedUser) return;

    const timer = setTimeout(() => {
      const savedLock = localStorage.getItem(lockKey);
      setLocked(Boolean(savedLock));
      setPinInput("");
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedUser, lockKey]);

  useEffect(() => {
    if (!selectedUser || !currentUser?._id || locked) return;

    const fetchMessages = async () => {
      try {
        const { data } = await API.get(`/messages/${selectedUser._id}`);
        setMessages(data);

        await API.put(`/messages/read/${selectedUser._id}`);

        socket.emit("messageRead", {
          receiverId: selectedUser._id,
          readerId: currentUser._id
        });
      } catch (error) {
        console.log("Messages fetch error:", error);
      }
    };

    fetchMessages();
  }, [selectedUser, currentUser?._id, locked]);

  useEffect(() => {
    if (!currentUser?._id) return;

    const handleReceive = async (msg) => {
      if (msg.sender === selectedUser?._id && !locked) {
        setMessages((prev) => [...prev, msg]);

        try {
          await API.put(`/messages/read/${selectedUser._id}`);

          socket.emit("messageRead", {
            receiverId: selectedUser._id,
            readerId: currentUser._id
          });
        } catch (error) {
          console.log("Read update error:", error);
        }
      }
    };

    const handleTyping = (senderId) => {
      if (senderId === selectedUser?._id) setTyping(true);
    };

    const handleStopTyping = (senderId) => {
      if (senderId === selectedUser?._id) setTyping(false);
    };

    const handleMessageRead = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === currentUser._id ? { ...m, isRead: true } : m
        )
      );
    };

    const handleMessageEdited = (editedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === editedMsg._id ? editedMsg : m))
      );
    };

    const handleMessageDeletedEveryone = (deletedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === deletedMsg._id ? deletedMsg : m))
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
  }, [selectedUser, currentUser?._id, locked]);

  useEffect(() => {
    const handleIncomingCall = (data) => {
      addCallHistory({
        name: data.callerName,
        pic: data.callerPic,
        type: data.callType,
        status: "Incoming"
      });

      setCallData({
        incoming: true,
        peerId: data.from,
        callerName: data.callerName,
        callerPic: data.callerPic,
        callType: data.callType,
        offer: data.offer
      });
    };

    socket.on("incomingCall", handleIncomingCall);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
    };
  }, [callHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setChatLock = () => {
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

    if (!selectedUser || !currentUser?._id) return;

    socket.emit("typing", {
      receiverId: selectedUser._id,
      senderId: currentUser._id
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", {
        receiverId: selectedUser._id,
        senderId: currentUser._id
      });
    }, 700);
  };

  const editMessage = async (msg) => {
    const newText = prompt("Edit message:", msg.text);

    if (!newText || newText.trim() === msg.text) return;

    try {
      const { data } = await API.put(`/messages/edit/${msg._id}`, {
        text: newText
      });

      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? data : m))
      );

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
      const { data } = await API.put(`/messages/delete-for-everyone/${msg._id}`);

      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? data : m))
      );

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
        audio: false
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
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const photoFile = new File([blob], `camera-${Date.now()}.png`, {
        type: "image/png"
      });

      setFile(photoFile);
      closeCamera();
    }, "image/png");
  };

  const sendMessage = async (audioBlob = null) => {
    if (!selectedUser || !currentUser?._id || sending) return;
    if (!text.trim() && !file && !audioBlob) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMsg = {
      _id: tempId,
      sender: currentUser._id,
      receiver: selectedUser._id,
      text: audioBlob ? "" : text,
      fileUrl: file ? URL.createObjectURL(file) : "",
      fileType: audioBlob ? "audio/webm" : file?.type || "",
      isRead: false,
      createdAt: new Date().toISOString(),
      sending: true
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

      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? data : m))
      );

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm"
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

    addCallHistory({
      name: selectedUser.name,
      pic: selectedUser.profilePic,
      type: "audio",
      status: "Outgoing"
    });

    setCallData({
      outgoing: true,
      peerId: selectedUser._id,
      callType: "audio"
    });
  };

  const startVideoCall = () => {
    if (!selectedUser) return;

    addCallHistory({
      name: selectedUser.name,
      pic: selectedUser.profilePic,
      type: "video",
      status: "Outgoing"
    });

    setCallData({
      outgoing: true,
      peerId: selectedUser._id,
      callType: "video"
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
            currentUser={currentUser}
            selectedUser={selectedUser}
            callData={callData}
            setCallData={setCallData}
          />
        )}
      </main>
    );
  }

  if (locked) {
    return (
      <main className="chat-area">
        <header className="chat-header">
          <img src={selectedUser.profilePic} alt={selectedUser.name} />
          <div>
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
            currentUser={currentUser}
            selectedUser={selectedUser}
            callData={callData}
            setCallData={setCallData}
          />
        )}
      </main>
    );
  }

  return (
    <main className="chat-area">
      <header className="chat-header">
        <img src={selectedUser.profilePic} alt={selectedUser.name} />

        <div>
          <h3>{selectedUser.name}</h3>
          <p>
            {typing
              ? "typing..."
              : onlineUsers.includes(selectedUser._id)
              ? "Online"
              : selectedUser.lastSeen
              ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleString()}`
              : "Offline"}
          </p>
        </div>

        <div className="call-buttons">
          <button onClick={startAudioCall}>
            <BsTelephoneFill />
          </button>

          <button onClick={startVideoCall}>
            <BsCameraVideoFill />
          </button>
        </div>

        <button className="chat-lock-btn" onClick={() => setShowCallHistory(true)}>
          History
        </button>

        <button className="chat-lock-btn" onClick={setChatLock}>
          Lock
        </button>

        {localStorage.getItem(lockKey) && (
          <button className="chat-lock-btn danger" onClick={removeChatLock}>
            Remove Lock
          </button>
        )}
      </header>

      <section
        className="messages-area"
        style={
          chatWallpaper
            ? {
                background: `linear-gradient(rgba(11,20,26,0.72), rgba(11,20,26,0.72)), url("${chatWallpaper}") center / cover no-repeat`
              }
            : undefined
        }
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            msg={msg}
            me={msg.sender === currentUser._id}
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

          <button type="button" className="attach-menu-btn" onClick={openCamera}>
            Camera
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

      {recording && <div className="recording-bar">🎤 Recording... tap stop</div>}

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

        {text.trim() || file ? (
          <button className="send-btn" onClick={() => sendMessage()}>
            <IoSend />
          </button>
        ) : recording ? (
          <button className="send-btn stop-record" onClick={stopRecording}>
            <BsStopFill />
          </button>
        ) : (
          <button className="send-btn mic-btn" onClick={startRecording}>
            <BsMicFill />
          </button>
        )}
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

            {callHistory.length === 0 ? (
              <p style={{ textAlign: "center", color: "#8696a0" }}>
                No call history
              </p>
            ) : (
              callHistory.map((call) => (
                <div className="call-history-row" key={call.id}>
                  <img src={call.pic} alt={call.name} />

                  <div>
                    <h4>{call.name}</h4>
                    <p>
                      {call.status} {call.type} call ·{" "}
                      {new Date(call.time).toLocaleString()}
                    </p>
                  </div>

                  <button onClick={() => deleteCallHistory(call.id)}>
                    Delete
                  </button>
                </div>
              ))
            )}

            {callHistory.length > 0 && (
              <button className="save-profile-btn" onClick={clearCallHistory}>
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {callData && (
        <CallModal
          currentUser={currentUser}
          selectedUser={selectedUser}
          callData={callData}
          setCallData={setCallData}
        />
      )}
    </main>
  );
}

export default ChatBox;