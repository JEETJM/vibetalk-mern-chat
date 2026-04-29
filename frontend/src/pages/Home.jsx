import { useEffect, useRef, useState } from "react";
import API from "../api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
// import StatusBar from "../components/StatusBar";
import StatusViewer from "../components/StatusViewer";

function Home() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [toast, setToast] = useState(null);
  const [openStatus, setOpenStatus] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("chatUser"));

  const selectedUserRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    audioRef.current = new Audio("/notify.mp3");
    audioRef.current.volume = 0.8;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      window.location.href = "/";
      return;
    }

    socket.emit("setup", currentUser._id);

    const handleOnlineUsers = (data) => {
      setOnlineUsers(data);
    };

    const handleReceiveMessage = (msg) => {
      if (String(msg.receiver) !== String(currentUser._id)) return;

      const senderId = String(msg.sender);
      const preview = msg.text || "📎 File / Voice message";

      setLastMessages((prev) => ({
        ...prev,
        [senderId]: {
          text: preview,
          time: msg.createdAt,
        },
      }));

      if (String(selectedUserRef.current?._id) !== senderId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));

        audioRef.current?.play().catch(() => {
          console.log("Sound blocked. Click once on page.");
        });

        const senderUser = users.find((u) => String(u._id) === senderId);

        setToast({
          name: senderUser?.name || "New message",
          text: preview,
          pic:
            senderUser?.profilePic ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        });

        setTimeout(() => setToast(null), 3500);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(senderUser?.name || "New message", {
            body: preview,
            icon:
              senderUser?.profilePic ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          });
        }
      }
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("receiveMessage", handleReceiveMessage);

    const fetchUsers = async () => {
      try {
        const { data } = await API.get("/users");

        console.log("USERS FROM BACKEND:", data);

        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.log(
          "USERS FETCH ERROR:",
          error.response?.data || error.message,
        );
        setUsers([]);
      }
    };

    fetchUsers();

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [currentUser?._id, selectedUser?._id]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);

    setUnreadCounts((prev) => ({
      ...prev,
      [String(user._id)]: 0,
    }));
  };

  if (!currentUser) return null;

  return (
    <div className="app-layout">
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
        users={users.map((u) => ({
          ...u,
          lastMessage: lastMessages[String(u._id)],
        }))}
        selectedUser={selectedUser}
        setSelectedUser={handleSelectUser}
        onlineUsers={onlineUsers}
        currentUser={currentUser}
        unreadCounts={unreadCounts}
      />

      <div className="main-chat-section">
        {/* <StatusBar
          currentUser={currentUser}
          onOpen={(list) => setOpenStatus(list)}
        /> */}

        <ChatBox
          selectedUser={selectedUser}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
        />
      </div>

      {openStatus && (
        <StatusViewer list={openStatus} onClose={() => setOpenStatus(null)} />
      )}
    </div>
  );
}

export default Home;
