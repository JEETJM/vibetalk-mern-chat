import { useEffect, useRef, useState } from "react";
import socket from "../socket";

function CallModal({
  currentUser,
  selectedUser,
  callData,
  setCallData,
  onCallFinish
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const timerRef = useRef(null);
  const durationRef = useRef(0);
  const callStartedRef = useRef(false);
  const finishedRef = useRef(false);

  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const isIncoming = Boolean(callData?.incoming);
  const isVideo = callData?.callType === "video";
  const peerId = callData?.peerId;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (timerRef.current) return;

    callStartedRef.current = true;

    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const saveCallHistory = (status = "Completed") => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (onCallFinish && callData?.historyId) {
      onCallFinish(callData.historyId, {
        status,
        durationSeconds: durationRef.current,
        durationText: formatDuration(durationRef.current)
      });
    }
  };

  const attachLocalPreview = () => {
    if (localVideoRef.current && localStreamRef.current && isVideo) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  const cleanUp = () => {
    stopTimer();

    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
    }

    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    localStreamRef.current = null;
    peerRef.current = null;

    setInCall(false);
    setMuted(false);
    setCameraOff(false);
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
      ]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && peerId) {
        socket.emit("iceCandidate", {
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    peer.ontrack = async (event) => {
      const remoteStream = event.streams?.[0];

      if (!remoteStream) return;

      console.log("REMOTE STREAM TRACKS:", remoteStream.getTracks());

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1;

        try {
          await remoteAudioRef.current.play();
        } catch (error) {
          console.log("Remote audio play blocked:", error.message);
        }
      }

      startTimer();
      setInCall(true);
    };

    peer.onconnectionstatechange = () => {
      console.log("Peer state:", peer.connectionState);

      if (peer.connectionState === "connected") {
        startTimer();
        setInCall(true);
      }

      if (
        peer.connectionState === "failed" ||
        peer.connectionState === "disconnected" ||
        peer.connectionState === "closed"
      ) {
        if (callStartedRef.current) {
          saveCallHistory("Completed");
        }
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: isVideo
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        : false
    });

    console.log("LOCAL STREAM TRACKS:", stream.getTracks());

    localStreamRef.current = stream;

    setTimeout(() => {
      attachLocalPreview();
    }, 100);

    return stream;
  };

  const startCall = async () => {
    try {
      if (!selectedUser?._id || !currentUser?._id) {
        alert("User data missing");
        setCallData(null);
        return;
      }

      const peer = createPeer();
      const stream = await getMedia();

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo
      });

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

      setTimeout(() => {
        attachLocalPreview();
      }, 200);
    } catch (error) {
      console.log("START CALL ERROR:", error);
      alert("Mic/Camera permission problem");
      saveCallHistory("Failed");
      cleanUp();
      setCallData(null);
    }
  };

  const acceptCall = async () => {
    try {
      if (!callData?.offer || !peerId) {
        alert("Call data missing");
        setCallData(null);
        return;
      }

      const peer = createPeer();
      const stream = await getMedia();

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(callData.offer));

      const answer = await peer.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo
      });

      await peer.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: peerId,
        answer
      });

      setInCall(true);
      startTimer();

      setTimeout(() => {
        attachLocalPreview();
      }, 200);
    } catch (error) {
      console.log("ACCEPT CALL ERROR:", error);
      alert("Mic/Camera permission problem");
      saveCallHistory("Failed");
      cleanUp();
      setCallData(null);
    }
  };

  const rejectCall = () => {
    if (peerId) {
      socket.emit("rejectCall", { to: peerId });
    }

    saveCallHistory("Rejected");
    cleanUp();
    setCallData(null);
  };

  const endCall = () => {
    if (peerId) {
      socket.emit("endCall", { to: peerId });
    }

    saveCallHistory(callStartedRef.current ? "Completed" : "Cancelled");
    cleanUp();
    setCallData(null);
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()?.[0];

    if (!audioTrack) {
      alert("Microphone not found");
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!audioTrack.enabled);
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()?.[0];

    if (!videoTrack) {
      alert("Camera not found");
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;
    setCameraOff(!videoTrack.enabled);
  };

  useEffect(() => {
    if (!callData?.outgoing) return;

    const timer = setTimeout(() => {
      startCall();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callData?.outgoing]);

  useEffect(() => {
    const handleAccepted = async ({ answer }) => {
      try {
        if (peerRef.current && answer) {
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }

        setInCall(true);
        startTimer();

        setTimeout(() => {
          attachLocalPreview();
        }, 200);
      } catch (error) {
        console.log("CALL ACCEPTED ERROR:", error);
      }
    };

    const handleIce = async ({ candidate }) => {
      try {
        if (peerRef.current && candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.log("ICE ERROR:", error);
      }
    };

    const handleRejected = () => {
      saveCallHistory("Rejected");
      cleanUp();
      setCallData(null);
    };

    const handleEnded = () => {
      saveCallHistory(callStartedRef.current ? "Completed" : "Ended");
      cleanUp();
      setCallData(null);
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
      cleanUp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!callData) return null;

  return (
    <div className="call-overlay">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {!inCall && isIncoming ? (
        <div className="incoming-call-card">
          <img
            src={
              callData.callerPic ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="caller"
          />

          <h2>{callData.callerName || "Unknown Caller"}</h2>
          <p>{isVideo ? "Video call" : "Audio call"}</p>

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
          <div className="call-timer-badge">
            {inCall ? formatDuration(duration) : "Calling..."}
          </div>

          <div className="remote-box">
            {isVideo ? (
              <video ref={remoteVideoRef} autoPlay playsInline></video>
            ) : (
              <div className="audio-call-avatar">
                <img
                  src={
                    selectedUser?.profilePic ||
                    callData.callerPic ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt="audio caller"
                />

                <h2>
                  {selectedUser?.name || callData.callerName || "Audio Call"}
                </h2>

                <p>{inCall ? formatDuration(duration) : "Calling..."}</p>
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
            ></video>
          )}

          {isVideo && cameraOff && (
            <div className="camera-off-badge">Camera Off</div>
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