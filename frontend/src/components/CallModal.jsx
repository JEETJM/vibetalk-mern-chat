import { useEffect, useRef, useState } from "react";
import socket from "../socket";

function CallModal({ currentUser, selectedUser, callData, setCallData }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const incomingSoundRef = useRef(null);
  const outgoingSoundRef = useRef(null);
  const endSoundRef = useRef(null);

  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const isIncoming = callData?.incoming;
  const isVideo = callData?.callType === "video";

  const fallbackBeep = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 780;
      gain.gain.value = 0.08;

      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 350);
    } catch {}
  };

  const playSound = (type) => {
    let audio;

    if (type === "incoming") audio = incomingSoundRef.current;
    if (type === "outgoing") audio = outgoingSoundRef.current;
    if (type === "end") audio = endSoundRef.current;

    if (audio) {
      audio.currentTime = 0;
      audio.loop = type !== "end";
      audio.play().catch(() => fallbackBeep());
    } else {
      fallbackBeep();
    }
  };

  const stopAllSounds = () => {
    [incomingSoundRef.current, outgoingSoundRef.current, endSoundRef.current].forEach(
      (audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          audio.loop = false;
        }
      }
    );
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && callData?.peerId) {
        socket.emit("iceCandidate", {
          to: callData.peerId,
          candidate: event.candidate
        });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideo
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  const cleanUp = () => {
    stopAllSounds();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();

    localStreamRef.current = null;
    peerRef.current = null;

    setInCall(false);
    setMuted(false);
    setCameraOff(false);
  };

  const startCall = async () => {
    try {
      playSound("outgoing");

      const peer = createPeer();
      const stream = await getMedia();

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("callUser", {
        to: selectedUser._id,
        from: currentUser._id,
        callerName: currentUser.name,
        callerPic: currentUser.profilePic,
        callType: callData.callType,
        offer
      });

      setInCall(true);
    } catch {
      alert("Camera/Microphone permission denied");
      cleanUp();
      setCallData(null);
    }
  };

  const acceptCall = async () => {
    try {
      stopAllSounds();

      const peer = createPeer();
      const stream = await getMedia();

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(callData.offer));

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: callData.peerId,
        answer
      });

      setInCall(true);
    } catch {
      alert("Camera/Microphone permission denied");
      cleanUp();
      setCallData(null);
    }
  };

  const rejectCall = () => {
    socket.emit("rejectCall", { to: callData.peerId });
    playSound("end");
    cleanUp();
    setCallData(null);
  };

  const endCall = () => {
    if (callData?.peerId) {
      socket.emit("endCall", { to: callData.peerId });
    }

    playSound("end");

    setTimeout(() => {
      cleanUp();
      setCallData(null);
    }, 250);
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOff(!videoTrack.enabled);
    }
  };

  useEffect(() => {
    incomingSoundRef.current = new Audio("/sounds/incoming-call.mp3");
    outgoingSoundRef.current = new Audio("/sounds/outgoing-call.mp3");
    endSoundRef.current = new Audio("/sounds/call-end.mp3");

    if (callData?.incoming) {
      playSound("incoming");
    }

    if (callData?.outgoing) {
      startCall();
    }

    const handleAccepted = async ({ answer }) => {
      stopAllSounds();

      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }

      setInCall(true);
    };

    const handleIce = async ({ candidate }) => {
      try {
        if (peerRef.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch {}
    };

    const handleRejected = () => {
      alert("Call rejected");
      playSound("end");

      setTimeout(() => {
        cleanUp();
        setCallData(null);
      }, 250);
    };

    const handleEnded = () => {
      alert("Call ended");
      playSound("end");

      setTimeout(() => {
        cleanUp();
        setCallData(null);
      }, 250);
    };

    socket.on("callAccepted", handleAccepted);
    socket.on("iceCandidate", handleIce);
    socket.on("callRejected", handleRejected);
    socket.on("callEnded", handleEnded);

    return () => {
      socket.off("callAccepted", handleAccepted);
      socket.off("iceCandidate", handleIce);
      socket.off("callRejected", handleRejected);
      socket.off("callEnded", handleEnded);
      stopAllSounds();
    };
  }, []);

  if (!callData) return null;

  return (
    <div className="call-overlay">
      {!inCall && isIncoming ? (
        <div className="incoming-call-card">
          <img src={callData.callerPic} alt="caller" />
          <h2>{callData.callerName}</h2>
          <p>{callData.callType === "video" ? "Video call" : "Audio call"}</p>

          <div className="incoming-actions">
            <button className="reject-call" onClick={rejectCall}>
              Reject
            </button>

            <button className="accept-call" onClick={acceptCall}>
              Accept
            </button>
          </div>
        </div>
      ) : (
        <div className="call-screen">
          <div className="remote-box">
            {isVideo ? (
              <video ref={remoteVideoRef} autoPlay playsInline></video>
            ) : (
              <div className="audio-call-avatar">
                <img
                  src={selectedUser?.profilePic || callData.callerPic}
                  alt="audio caller"
                />
                <h2>{selectedUser?.name || callData.callerName}</h2>
                <p>Audio call running...</p>
              </div>
            )}
          </div>

          {isVideo && (
            <video
              className="local-video"
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ transform: "scaleX(-1)" }}
            ></video>
          )}

          <div className="call-controls">
            <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>

            {isVideo && (
              <button onClick={toggleCamera}>
                {cameraOff ? "Camera On" : "Camera Off"}
              </button>
            )}

            <button className="end-call" onClick={endCall}>
              End
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CallModal;