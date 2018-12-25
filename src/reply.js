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
    
    console.log('Peer A creates a peer connection with a data channel');

    const sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);
    
    console.log('Peer A creates an offer and sets it as its local description');
    
    broadcast(peerConnection);
    
    console.log('Peer A displays the offer SDP and its ICE candidate SDPs');
    
    return;
  }
  
  if (message.startsWith('a=candidate:')) {
    const [sdp, id] = message.split('\n');
    const peerConnection = peerConnections[id];
    
    console.log('Peer ? notices peer ? candidate SDP and adds the ICE candidate to its peer connection', peerConnection);
    
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
      
      console.log('Peer B notices the offer SDP');

      const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      peerConnections[id] = peerConnection;
      monitor(peerConnection, 'peerConnection');
      
      console.log('Peer B creates a peer connection without a data channel');
      
      await peerConnection.setRemoteDescription(sessionDescription);
      
      console.log('Peer B sets the noticed offer as its remote description');
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      console.log('Peer B creates an answer and sets it to its local description');
      
      broadcast(peerConnection);
      
      console.log('Peer B displays the answer SDP and its ICE candidate SDPs');
      
      break;
    }
    case 'answer': {
      // Ignore the answer if it has already been set and we're seeing it again
      if (me.remoteDescription !== null) {
        break;
      }
      
      console.log('Peer A notices the answer SDP');
      
      log('local ' + me.localDescription.type);
      log(me.localDescription.sdp);
      log('remote' + sessionDescription.type);
      log(sessionDescription.sdp);
      
      await me.setRemoteDescription(sessionDescription);
      
      console.log('Peer A sets the noticed answer as its remote description');
      
      // TODO: Ensure answer candidates are added my the `me` offering connection
      break;
    }
    default: {
      throw new Error(`Unexpected session description type '${sessionDescription.type}'.`);
    }
  }
}
