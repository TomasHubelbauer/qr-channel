import decode from './decode.js';
import monitor from './monitor.js';
import broadcast from './broadcast.js';
import log from './log.js';

const peerConnections = {};
let me;
export default async function reply(message) {
  // Display the initial welcome offer which either will be replied to or replaced with a peer's offer
  if (message === undefined) {
    const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    me = peerConnection;
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
    const peerConnection = peerConnections[id];
    if (peerConnection !== undefined) {
      // Avoid adding the candidate multiple times
      if (!peerConnection.remoteDescription.sdp.split(/\r\n/g).includes(sdp)) {
        await peerConnection.addIceCandidate(new RTCIceCandidate({ candidate: sdp, sdpMid: "0", sdpMLineIndex: 0 }));
      }
    } else {
      // TODO: Store the candidate for if later its associated peer connection comes
    }
    
    return;
  }
  
  const sessionDescription = decode(message);
  switch (sessionDescription.type) {
    case 'offer': {
      // Decode the session ID separately to avoid parsing the SDP again
      const idLength = Number(message[1]) + 10;
      const id = message.slice(2 + 64, 2 + 64 + idLength);
      
      // Ignore the offer in case we're already answering to it
      if (peerConnections[id] !== undefined) {
        break;
      }

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
      // Ignore the answer if it has already been set and we're seeing it again
      if (me.remoteDescription !== null) {
        break;
      }
      
      log('local ' + me.localDescription.type);
      log(me.localDescription.sdp);
      log('remote' + sessionDescription.type);
      log(sessionDescription.sdp);
      
      await me.setRemoteDescription(sessionDescription);
      // TODO: Ensure answer candidates are added my the `me` offering connection
      break;
    }
    default: {
      throw new Error(`Unexpected session description type '${sessionDescription.type}'.`);
    }
  }
}
