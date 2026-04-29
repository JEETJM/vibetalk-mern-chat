const User = require("./models/User");

const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("setup", async (userId) => {
      onlineUsers.set(userId.toString(), socket.id);
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("sendMessage", (message) => {
      const receiverSocket = onlineUsers.get(message.receiver.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", message);
      }
    });

    socket.on("typing", ({ receiverId, senderId }) => {
      const receiverSocket = onlineUsers.get(receiverId.toString());
      if (receiverSocket) io.to(receiverSocket).emit("typing", senderId);
    });

    socket.on("stopTyping", ({ receiverId, senderId }) => {
      const receiverSocket = onlineUsers.get(receiverId.toString());
      if (receiverSocket) io.to(receiverSocket).emit("stopTyping", senderId);
    });

    socket.on("messageRead", ({ receiverId, readerId }) => {
      const receiverSocket = onlineUsers.get(receiverId.toString());
      if (receiverSocket) io.to(receiverSocket).emit("messageRead", readerId);
    });

    socket.on("editMessage", (message) => {
      const receiverSocket = onlineUsers.get(message.receiver.toString());
      if (receiverSocket) io.to(receiverSocket).emit("messageEdited", message);
    });

    socket.on("deleteMessageEveryone", (message) => {
      const receiverSocket = onlineUsers.get(message.receiver.toString());
      if (receiverSocket) io.to(receiverSocket).emit("messageDeletedEveryone", message);
    });

    // CALL EVENTS
    socket.on("callUser", ({ to, from, callerName, callerPic, callType, offer }) => {
      const receiverSocket = onlineUsers.get(to.toString());
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
      const receiverSocket = onlineUsers.get(to.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit("callAccepted", { answer });
      }
    });

    socket.on("iceCandidate", ({ to, candidate }) => {
      const receiverSocket = onlineUsers.get(to.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit("iceCandidate", { candidate });
      }
    });

    socket.on("rejectCall", ({ to }) => {
      const receiverSocket = onlineUsers.get(to.toString());
      if (receiverSocket) io.to(receiverSocket).emit("callRejected");
    });

    socket.on("endCall", ({ to }) => {
      const receiverSocket = onlineUsers.get(to.toString());
      if (receiverSocket) io.to(receiverSocket).emit("callEnded");
    });

    socket.on("disconnect", async () => {
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
    });
  });
};

module.exports = socketHandler;