import decode from './decode.js';
import monitor from './monitor.js';

const peerConnections = {};

export default async function reply(message) {
  if (message.startsWith('a=candidate:')) {
    // TODO: Figure out what peer connection the candidate belongs to from the session ID (add it to the candidate QR code)
    const sessionId = 'todo';
    const peerConnection = peerConnections[sessionId];
    // Ignore the candidate if we do not yet have the connection it belongs to
    // TODO: Also ignore the candidate if it already has been added unless it is safe to add duplicate candidates
    if (peerConnection !== undefined) {
      const candidate = null;
      await peerConnection.addIceCandidate();
    }
    
    return;
  }
  
  const sessionDescription = decode(message);
  switch (sessionDescription.type) {
    case 'offer': {
      // TODO: Discard own offering peer connection
      const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      const sessionId = 'todo';
      peerConnections[sessionId] = peerConnection;
      monitor(peerConnection, 'peerConnection');
      
      // TODO: Broadcast this new peer connection so that we start showing the answer and its candidates
      
      await peerConnection.setRemoteDescription(sessionDescription);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // TODO: Wait for the data channel event and its opening event
      console.log('Waiting for the data channel');
      break;
    }
    case 'answer': {
      throw new Error('TODO: Implement handling answer to my own offer');
      break;
    }
    default: {
      throw new Error(`Unexpected session description type '${sessionDescription.type}'.`);
    }
  }
}
