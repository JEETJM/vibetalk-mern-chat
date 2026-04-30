import { useEffect, useRef, useState } from "react";
import API from "../api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";

function Home() {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("chatUser") || "null")
  );

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [toast, setToast] = useState(null);

  const selectedUserRef = useRef(null);
  const usersRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    audioRef.current = new Audio("/notify.mp3");
    audioRef.current.volume = 0.8;
  }, []);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("chatUser") || "null");

    if (!savedUser?.token) {
      window.location.replace("/login");
      return;
    }

    setCurrentUser(savedUser);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return;

    socket.emit("setup", currentUser._id);

    const handleOnlineUsers = (usersList) => {
      setOnlineUsers(Array.isArray(usersList) ? usersList : []);
    };

    const handleReceiveMessage = (msg) => {
      if (!msg?.sender) return;

      const senderId = String(msg.sender);
      const receiverId = String(msg.receiver || "");

      if (receiverId && receiverId !== String(currentUser._id)) return;

      const preview =
        msg.text ||
        (msg.fileType?.startsWith("image") ? "📷 Photo" : "") ||
        (msg.fileType?.startsWith("audio") ? "🎤 Voice message" : "") ||
        (msg.fileType ? "📎 File" : "New message");

      setLastMessages((prev) => ({
        ...prev,
        [senderId]: {
          text: preview,
          time: msg.createdAt || new Date().toISOString()
        }
      }));

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          String(user._id) === senderId
            ? {
                ...user,
                lastMessage: {
                  text: preview,
                  time: msg.createdAt || new Date().toISOString()
                }
              }
            : user
        )
      );

      if (String(selectedUserRef.current?._id) === senderId) {
        return;
      }

      setUnreadCounts((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1
      }));

      audioRef.current?.play().catch(() => {
        console.log("Notification sound blocked. Tap/click once on page.");
      });

      const senderUser = usersRef.current.find(
        (user) => String(user._id) === senderId
      );

      setToast({
        name: senderUser?.name || "New message",
        text: preview,
        pic:
          senderUser?.profilePic ||
          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      });

      setTimeout(() => {
        setToast(null);
      }, 3500);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(senderUser?.name || "New message", {
          body: preview,
          icon:
            senderUser?.profilePic ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        });
      }
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [currentUser?._id]);

  useEffect(() => {
    if (!currentUser?.token) return;

    const fetchUsers = async () => {
      try {
        const { data } = await API.get("/users");

        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.log("Users data is not array:", data);
          setUsers([]);
        }
      } catch (error) {
        console.log("USERS FETCH ERROR:", error.response?.data || error.message);
        setUsers([]);
      }
    };

    fetchUsers();
  }, [currentUser?.token]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);

    setUnreadCounts((prev) => ({
      ...prev,
      [String(user._id)]: 0
    }));
  };

  const usersWithLastMessage = users.map((user) => ({
    ...user,
    lastMessage: lastMessages[String(user._id)] || user.lastMessage
  }));

  if (!currentUser) return null;

  return (
    <div className={`app-layout ${selectedUser ? "chat-open" : ""}`}>
      {toast && (
        <div className="chat-toast">
          <img src={toast.pic} alt="notification" />

          <div>
            <h4>{toast.name}</h4>
            <p>{toast.text}</p>
          </div>
        </div>
      )}

      <Sidebar
        users={usersWithLastMessage}
        selectedUser={selectedUser}
        setSelectedUser={handleSelectUser}
        onlineUsers={onlineUsers}
        currentUser={currentUser}
        unreadCounts={unreadCounts}
      />

      <ChatBox
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        currentUser={currentUser}
        onlineUsers={onlineUsers}
      />
    </div>
  );
}

export default Home;