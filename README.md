

<div align="center">

# ⚡ VibeTalk

### Premium WhatsApp-Style MERN Real-Time Chat Application

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=26&pause=1000&color=00A884&center=true&vCenter=true&width=800&lines=Real-Time+MERN+Chat+Application;Private+1-to-1+Messaging;Voice+%2B+Video+Calling;Status+%2B+Camera+%2B+File+Sharing;Built+by+Jeet+Mondal" />

<br />

![React](https://img.shields.io/badge/React-202c33?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-202c33?style=for-the-badge&logo=node.js&logoColor=3C873A)
![Express](https://img.shields.io/badge/Express-202c33?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-202c33?style=for-the-badge&logo=mongodb&logoColor=47A248)
![Socket.io](https://img.shields.io/badge/Socket.io-202c33?style=for-the-badge&logo=socket.io&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-202c33?style=for-the-badge&logo=cloudinary&logoColor=3448C5)

</div>

---

## 📌 About Project

**VibeTalk** is a full-stack MERN real-time chat application inspired by WhatsApp.  
It supports private messaging, media sharing, voice messages, status, profile customization, audio/video calls, chat lock, call history and a premium dark UI.

---

## ✨ Features

### 🔐 Authentication
- User registration
- User login
- JWT authentication
- Protected routes
- MongoDB Atlas database

### 💬 Real-Time Chat
- Private 1-to-1 chat
- Socket.io real-time messaging
- Typing indicator
- Online/offline status
- Last seen
- Read receipt blue tick
- Message edit
- Delete for me
- Delete for everyone

### 📎 Media Sharing
- Text messages
- Image upload
- Document upload
- Audio file upload
- Camera capture
- Fullscreen image preview
- Cloudinary media storage

### 🎙 Voice
- Voice message recording
- Audio player bubble
- Microphone permission handling

### 😀 Emoji
- Emoji picker
- Emoji message support

### 🖼 Profile
- Profile picture update
- Name update
- About update
- Chat wallpaper change

### 🟢 Status
- Image status
- Text status
- Camera status
- Fullscreen status viewer
- Status delete
- 24-hour auto expiry

### 📞 Calls
- Audio call
- Video call
- Incoming call popup
- Accept / reject call
- Mute mic
- Camera off
- End call
- Call history
- Delete call history

### 🔔 Notification
- Unread count badge
- Last message preview
- Notification sound
- Toast popup

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- CSS
- Socket.io Client
- Emoji Picker React
- React Icons
- WebRTC

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.io
- JWT
- Multer
- Cloudinary

---

## 📁 Folder Structure

```txt
vibetalk-mern-chat
├── backend
│   ├── config
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── server.js
│   └── socket.js
│
├── frontend
│   ├── public
│   └── src
│       ├── components
│       ├── pages
│       ├── styles
│       ├── api.js
│       └── socket.js
│
├── package.json
├── README.md
└── .gitignore
