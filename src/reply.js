import decode from './decode.js';
import monitor from './monitor.js';
import broadcast from './broadcast.js';

const peerConnections = {};

export default async function reply(message) {
  // Display the initial welcome offer which either will be replied to or replaced with a peer's offer
  if (message === undefined) {
    const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    monitor(peerConnection, 'peerConnection');

    const dataChannel = peerConnection.createDataChannel(null);
    monitor(dataChannel, 'dataChannel');

    const sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);

    broadcast(peerConnection);
    return;
  }
  
  if (message.startsWith('a=candidate:')) {
    const [sdp, sessionId] = message.split('\n');
    console.log(sdp, sessionId);
    const peerConnection = peerConnections[sessionId];
    if (peerConnection !== undefined) {
      // TODO: Ignore the candidate if it already has been added unless it is safe to add duplicate candidate
      await peerConnection.addIceCandidate(new RTCIceCandidate({ candidate: sdp }));
    } else {
      // TODO: Store the canndidate for if the connection comes later
    }
    
    return;
  }
  
  const sessionDescription = decode(message);
  switch (sessionDescription.type) {
    case 'offer': {
      const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      const sessionId = 'todo';
      peerConnections[sessionId] = peerConnection;
      monitor(peerConnection, 'peerConnection');
      
      await peerConnection.setRemoteDescription(sessionDescription);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      broadcast(peerConnection);
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
