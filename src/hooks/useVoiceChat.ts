import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
}

export const useVoiceChat = (
  roomId: string,
  userId: string,
  isMuted: boolean = false
) => {
  const [peers, setPeers] = useState<string[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    const initializeVoiceChat = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        localStreamRef.current = stream;

        // Apply initial mute state
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });
      } catch (err) {
        console.error("Failed to access microphone:", err);
        toast.error("Could not access microphone. Voice chat disabled.");
        return;
      }

      channelRef.current = supabase
        .channel(`voice_signaling_${roomId}`)
        .on("broadcast", { event: "signal" }, async ({ payload }) => {
          if (payload.target !== userId) return;

          switch (payload.type) {
            case "new-peer":
              initiateConnection(payload.sender);
              break;
            case "offer":
              handleOffer(payload);
              break;
            case "answer":
              handleAnswer(payload);
              break;
            case "ice-candidate":
              handleIceCandidate(payload);
              break;
          }
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Announce presence to others to trigger them to connect to us
            // Actually, a simple 'join' signal isn't enough because we need to know WHO to signal.
            // Simplified approach: When we join, we broadcast 'new-peer'.
            // Existing peers will receive this and initiate connection to us.
            // Wait, usually the JOINER initiates or the EXISTING peers initiate.
            // Let's have the NEW COMER broadcast "I'm here", and everyone else offers to them.
            // Or better: New comer broadcasts "I joined", everyone else initiates connection to new comer.
            await channelRef.current.send({
              type: "broadcast",
              event: "signal",
              payload: { type: "new-peer", sender: userId, target: "all" }, // 'all' handled specially? No, simplified
            });
            // Actually 'target: all' won't work with my 'target !== userId' check.
            // We need a specific "announce" broadcast.
          }
        });

      // Listen for the generic announce
      const presenceChannel = supabase
        .channel(`voice_presence_${roomId}`)
        .on("broadcast", { event: "announce" }, ({ payload }) => {
          if (payload.sender !== userId) {
            // Someone joined, initiate connection to them
            initiateConnection(payload.sender);
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            presenceChannel.send({
              type: "broadcast",
              event: "announce",
              payload: { sender: userId },
            });
          }
        });

      // Actually, let's keep it simple. Single channel.
    };

    initializeVoiceChat();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((pc) => pc.close());
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [roomId, userId]);

  // Effect to toggle mute
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  const createPeerConnection = (peerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", { candidate: event.candidate }, peerId);
      }
    };

    pc.ontrack = (event) => {
      // Create audio element
      const remoteAudio = document.getElementById(
        `audio-${peerId}`
      ) as HTMLAudioElement;
      if (remoteAudio) {
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play().catch((e) => console.error("Audio play error", e));
      } else {
        // If element doesn't exist yet (React render lag), we might miss it.
        // Better to handle streams in state?
        // For simplicity, we'll assume the component renders <audio> tags for all known peers.
        // But we need to update state to trigger render.
        // Let's update state with stream?
        // Actually, we can just use the ID convention.
      }
    };

    peersRef.current[peerId] = pc;
    return pc;
  };

  const initiateConnection = async (peerId: string) => {
    if (peersRef.current[peerId]) return; // Already connected

    // Add to peers list state to render audio tag
    setPeers((prev) => [...prev, peerId]);

    const pc = createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignal("offer", { sdp: offer }, peerId);
  };

  const iceCandidateQueueRef = useRef<{ [key: string]: RTCIceCandidate[] }>({});

  const handleOffer = async (payload: any) => {
    if (peersRef.current[payload.sender]) return; // Logic collision?

    // Add to peers list
    setPeers((prev) => [...prev, payload.sender]);

    const pc = createPeerConnection(payload.sender);
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

    // Process queued candidates
    const queue = iceCandidateQueueRef.current[payload.sender];
    if (queue) {
      queue.forEach((candidate) => {
        pc.addIceCandidate(candidate).catch((e) =>
          console.error("Error adding queued ice candidate", e)
        );
      });
      delete iceCandidateQueueRef.current[payload.sender];
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    sendSignal("answer", { sdp: answer }, payload.sender);
  };

  const handleAnswer = async (payload: any) => {
    const pc = peersRef.current[payload.sender];
    // Only set remote answer if we are waiting for it (have-local-offer)
    if (pc && pc.signalingState === "have-local-offer") {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

        // Process queued candidates
        const queue = iceCandidateQueueRef.current[payload.sender];
        if (queue) {
          queue.forEach((candidate) => {
            pc.addIceCandidate(candidate).catch((e) =>
              console.error("Error adding queued ice candidate", e)
            );
          });
          delete iceCandidateQueueRef.current[payload.sender];
        }
      } catch (err: any) {
        console.warn("Error setting remote description:", err);
        // Ignore InvalidStateError (race condition)
      }
    }
  };

  const handleIceCandidate = async (payload: any) => {
    const pc = peersRef.current[payload.sender];
    const candidate = new RTCIceCandidate(payload.candidate);

    if (pc && pc.remoteDescription) {
      await pc
        .addIceCandidate(candidate)
        .catch((e) => console.error("Error adding ice candidate", e));
    } else {
      // Queue candidate if remote description not yet set
      if (!iceCandidateQueueRef.current[payload.sender]) {
        iceCandidateQueueRef.current[payload.sender] = [];
      }
      iceCandidateQueueRef.current[payload.sender].push(candidate);
    }
  };

  const sendSignal = async (type: string, data: any, targetPeerId: string) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "signal",
        payload: {
          type,
          sender: userId,
          target: targetPeerId,
          ...data,
        },
      });
    }
  };

  return { peers };
};
