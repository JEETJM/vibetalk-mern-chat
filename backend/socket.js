const User = require("./models/User");

const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("setup", async (userId) => {
      try {
        if (!userId) return;

        onlineUsers.set(String(userId), socket.id);

        await User.findByIdAndUpdate(userId, {
          isOnline: true
        });

        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      } catch (error) {
        console.log("SOCKET SETUP ERROR:", error.message);
      }
    });

    socket.on("sendMessage", (message) => {
      try {
        if (!message?.receiver) return;

        const receiverSocket = onlineUsers.get(String(message.receiver));

        if (receiverSocket) {
          io.to(receiverSocket).emit("receiveMessage", message);
        }
      } catch (error) {
        console.log("SEND MESSAGE SOCKET ERROR:", error.message);
      }
    });

    socket.on("typing", ({ receiverId, senderId }) => {
      const receiverSocket = onlineUsers.get(String(receiverId));

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", senderId);
      }
    });

    socket.on("stopTyping", ({ receiverId, senderId }) => {
      const receiverSocket = onlineUsers.get(String(receiverId));

      if (receiverSocket) {
        io.to(receiverSocket).emit("stopTyping", senderId);
      }
    });

    socket.on("messageRead", ({ receiverId, readerId }) => {
      const receiverSocket = onlineUsers.get(String(receiverId));

      if (receiverSocket) {
        io.to(receiverSocket).emit("messageRead", readerId);
      }
    });

    socket.on("editMessage", (message) => {
      if (!message?.receiver) return;

      const receiverSocket = onlineUsers.get(String(message.receiver));

      if (receiverSocket) {
        io.to(receiverSocket).emit("messageEdited", message);
      }
    });

    socket.on("deleteMessageEveryone", (message) => {
      if (!message?.receiver) return;

      const receiverSocket = onlineUsers.get(String(message.receiver));

      if (receiverSocket) {
        io.to(receiverSocket).emit("messageDeletedEveryone", message);
      }
    });

    socket.on("callUser", ({ to, from, callerName, callerPic, callType, offer }) => {
      const receiverSocket = onlineUsers.get(String(to));

      if (receiverSocket) {
        io.to(receiverSocket).emit("incomingCall", {
          from,
          callerName,
          callerPic,
          callType,
          offer
        });
      }
    });

    socket.on("answerCall", ({ to, answer }) => {
      const receiverSocket = onlineUsers.get(String(to));

      if (receiverSocket) {
        io.to(receiverSocket).emit("callAccepted", { answer });
      }
    });

    socket.on("iceCandidate", ({ to, candidate }) => {
      const receiverSocket = onlineUsers.get(String(to));

      if (receiverSocket) {
        io.to(receiverSocket).emit("iceCandidate", { candidate });
      }
    });

    socket.on("rejectCall", ({ to }) => {
      const receiverSocket = onlineUsers.get(String(to));

      if (receiverSocket) {
        io.to(receiverSocket).emit("callRejected");
      }
    });

    socket.on("endCall", ({ to }) => {
      const receiverSocket = onlineUsers.get(String(to));

      if (receiverSocket) {
        io.to(receiverSocket).emit("callEnded");
      }
    });

    socket.on("disconnect", async () => {
      try {
        let disconnectedUserId = null;

        for (const [userId, socketId] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
            onlineUsers.delete(userId);
            break;
          }
        }

        if (disconnectedUserId) {
          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            lastSeen: new Date()
          });
        }

        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        console.log("Socket disconnected:", socket.id);
      } catch (error) {
        console.log("SOCKET DISCONNECT ERROR:", error.message);
      }
    });
  });
};

module.exports = socketHandler;