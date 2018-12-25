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
    const [sdp, id] = message.split('\n');
    console.log('ice', id, sdp);
    const peerConnection = peerConnections[id];
    if (peerConnection !== undefined) {
      // Avoid adding the candidate multiple times
      if (!peerConnection.remoteDescription.split(/\r\n/g).includes(sdp)) {
        await peerConnection.addIceCandidate(new RTCIceCandidate({ candidate: sdp, sdpMid: "0", sdpMLineIndex: 0 }));
        console.log('added', sdp, peerConnection.remoteDescription.sdp);
      } else {
        console.log('ignored', sdp);
      }
    } else {
      // TODO: Store the canndidate for if the connection comes later
    }
    
    return;
  }
  
  const sessionDescription = decode(message);
  switch (sessionDescription.type) {
    case 'offer': {
      // Decode the session ID separately to avoid parsing the SDP
      const idLength = Number(message[1]) + 10;
      const id = message.slice(2 + 64, 2 + 64 + idLength);
      console.log('sdp', id);
      const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      peerConnections[id] = peerConnection;
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
