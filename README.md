<div align="center">

# ⚡ VibeTalk

## Premium WhatsApp-Style MERN Real-Time Chat Application

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=800&size=26&duration=2600&pause=800&color=00A884&center=true&vCenter=true&width=900&lines=Private+1-to-1+Real-Time+Chat;WhatsApp-Style+Premium+UI;Text+Image+File+Voice+Messages;Audio+%26+Video+Calling+with+WebRTC;Status+Camera+Wallpaper+Chat+Lock;Built+by+Jeet+Mondal" alt="Typing SVG" />

<br />

![React](https://img.shields.io/badge/React-202c33?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-202c33?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Node.js](https://img.shields.io/badge/Node.js-202c33?style=for-the-badge&logo=node.js&logoColor=3C873A)
![Express](https://img.shields.io/badge/Express-202c33?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-202c33?style=for-the-badge&logo=mongodb&logoColor=47A248)
![Socket.io](https://img.shields.io/badge/Socket.io-202c33?style=for-the-badge&logo=socket.io&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-202c33?style=for-the-badge&logo=cloudinary&logoColor=3448C5)
![JWT](https://img.shields.io/badge/JWT-202c33?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

<br />

### 🔥 Real-Time Chat • Voice Message • Audio/Video Call • Status • Chat Lock • Premium Mobile UI

</div>

---

## 📌 About VibeTalk

**VibeTalk** is a premium WhatsApp-style full-stack real-time chat application built with the **MERN stack**.  
It supports private one-to-one messaging, live socket communication, image/file sharing, voice recording, status upload, chat wallpaper, chat lock, notification badge, call history, and WebRTC-based audio/video calling.

This project is designed to feel like a modern private messaging app with a clean premium dark UI and responsive mobile-first layout.

---

## 🚀 Live Demo

```txt
Live Link: https://vibetalk-mern-chat.onrender.com


✨ Main Features
🔐 Authentication
✅ Register account
✅ Login account
✅ JWT token authentication
✅ Protected home route
✅ Logout system
✅ MongoDB Atlas user storage


💬 Real-Time Private Chat

✅ Private 1-to-1 chat
✅ Socket.io real-time messaging
✅ Send and receive instant messages
✅ Last message preview
✅ Unread message badge
✅ Toast popup notification
✅ Notification sound
✅ Online / offline status
✅ Last seen
✅ Typing indicator
✅ Read receipt blue tick


📎 Media & File Sharing

✅ Text messages
✅ Image upload
✅ PDF / document upload
✅ Audio file upload
✅ Camera capture photo
✅ Fullscreen image preview
✅ Cloudinary file storage


🎙 Voice Message

✅ Microphone recording
✅ Start recording
✅ Stop recording
✅ Upload voice blob
✅ Voice/audio player message bubble


📞 Audio & Video Call

✅ Audio call
✅ Video call
✅ Incoming call popup
✅ Accept / Reject call
✅ End call
✅ Mute / Unmute microphone
✅ Camera on / off
✅ Local camera preview
✅ Remote audio stream
✅ Remote video stream
✅ Call timer
✅ Call history with duration
🟢 Status System
✅ Image status
✅ Video status
✅ Text status
✅ Camera status
✅ Status viewer
✅ Status delete option
✅ Status auto expiry after 24 hours


👤 Profile & Customization

✅ Profile picture update
✅ Name update
✅ About update
✅ Chat wallpaper change
✅ Premium profile modal
✅ Cloudinary upload support


🔒 Privacy Features

✅ Chat lock with PIN
✅ Call history secret PIN
✅ Private user-based call history
✅ User-wise private chat


📱 Responsive UI

✅ WhatsApp-style sidebar
✅ Mobile chat screen
✅ Mobile back button
✅ Responsive header
✅ Responsive message bubbles
✅ Responsive call screen
✅ Responsive landing page


🖼 UI Highlights

🌙 Premium dark theme
⚡ VibeTalk brand label
🟢 WhatsApp-style green accent
📱 Mobile-first layout
💬 Clean chat bubbles
📞 Modern call screen
🔔 Toast notification
🔐 Privacy-focused UI



🛠 Tech Stack

Frontend
React
Vite
CSS
React Icons
Emoji Picker React
Socket.io Client
WebRTC
Axios
React Router DOM
Backend
Node.js
Express.js
MongoDB
Mongoose
Socket.io
JWT
Bcrypt.js
Multer
Cloudinary
Dotenv
CORS
Database & Storage
MongoDB Atlas
Cloudinary
LocalStorage for UI privacy features
Deployment
Render Full-Stack Web Service
Single Link Deployment









📁 Project Folder Structure



vibetalk-mern-chat
│
├── backend
│   ├── config
│   │   ├── db.js
│   │   └── cloudinary.js
│   │
│   ├── middleware
│   │   ├── authMiddleware.js
│   │   └── upload.js
│   │
│   ├── models
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Status.js
│   │
│   ├── routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── profileRoutes.js
│   │   └── statusRoutes.js
│   │
│   ├── server.js
│   ├── socket.js
│   ├── package.json
│   └── .env
│
├── frontend
│   ├── public
│   │   ├── notify.mp3
│   │   └── sounds
│   │
│   ├── src
│   │   ├── components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatBox.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ProfileModal.jsx
│   │   │   ├── StatusViewer.jsx
│   │   │   └── CallModal.jsx
│   │   │
│   │   ├── pages
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Home.jsx
│   │   │
│   │   ├── styles
│   │   │   └── chat.css
│   │   │
│   │   ├── api.js
│   │   ├── socket.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env
│
├── package.json
├── README.md
└── .gitignore
