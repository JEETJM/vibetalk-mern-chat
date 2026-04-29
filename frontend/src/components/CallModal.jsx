import { useEffect, useRef, useState } from "react";
import socket from "../socket";

function CallModal({ currentUser, selectedUser, callData, setCallData }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const isIncoming = Boolean(callData?.incoming);
  const isVideo = callData?.callType === "video";
  const peerId = callData?.peerId;

  const cleanUp = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();

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

      console.log("REMOTE STREAM:", remoteStream.getTracks());

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
          console.log("Remote audio blocked:", error.message);
        }
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("Peer state:", peer.connectionState);
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
    });

    console.log("LOCAL STREAM:", stream.getTracks());

    localStreamRef.current = stream;

    if (localVideoRef.current && isVideo) {
      localVideoRef.current.srcObject = stream;
    }

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
    } catch (error) {
      console.log("START CALL ERROR:", error);
      alert("Mic/Camera permission problem");
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

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: peerId,
        answer
      });

      setInCall(true);
    } catch (error) {
      console.log("ACCEPT CALL ERROR:", error);
      alert("Mic/Camera permission problem");
      cleanUp();
      setCallData(null);
    }
  };

  const rejectCall = () => {
    if (peerId) socket.emit("rejectCall", { to: peerId });
    cleanUp();
    setCallData(null);
  };

  const endCall = () => {
    if (peerId) socket.emit("endCall", { to: peerId });
    cleanUp();
    setCallData(null);
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()?.[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!audioTrack.enabled);
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()?.[0];
    if (!videoTrack) return;

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
      cleanUp();
      setCallData(null);
    };

    const handleEnded = () => {
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

                <h2>{selectedUser?.name || callData.callerName || "Audio Call"}</h2>
                <p>{inCall ? "Audio call running..." : "Calling..."}</p>
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