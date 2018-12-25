import decode from './decode.js';
import monitor from './monitor.js';
import broadcast from './broadcast.js';
import log from './log.js';
import identify from './identify.js';

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
    
    console.log('Peer A creates an offer and sets it as its local description', identify(peerConnection.localDescription));
    
    broadcast(peerConnection);
    
    console.log('Peer A displays the offer SDP and its ICE candidate SDPs', identify(peerConnection.localDescription));
    
    return;
  }
  
  if (message.startsWith('a=candidate:')) {
    const [sdp, id] = message.split('\n');
    const peerConnection = peerConnections[id];
    
    console.log(`Peer ? notices peer ? candidate SDP and adds the ICE candidate to its peer connection`, identify(peerConnection.localDescription), identify(peerConnection.remoteDescription));
    
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
      const id = identify(sessionDescription);
      
      // Ignore the offer in case we're already answering to it
      if (peerConnections[id] !== undefined) {
        break;
      }
      
      console.log('Peer B notices the offer SDP', id);

      const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      peerConnections[id] = peerConnection;
      monitor(peerConnection, 'peerConnection');
      
      console.log('Peer B creates a peer connection without a data channel');
      
      await peerConnection.setRemoteDescription(sessionDescription);
      
      console.log('Peer B sets the noticed offer as its remote description', id);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      console.log('Peer B creates an answer and sets it to its local description', identify(peerConnection.localDescription));
      
      broadcast(peerConnection);
      
      console.log('Peer B displays the answer SDP and its ICE candidate SDPs', identify(peerConnection.localDescription));
      
      break;
    }
    case 'answer': {
      // Ignore the answer if it has already been set and we're seeing it again
      if (me.remoteDescription !== null) {
        break;
      }
      
      const id = identify(sessionDescription);
      
      console.log('Peer A notices the answer SDP', id);
            
      await me.setRemoteDescription(sessionDescription);
      
      console.log('Peer A sets the noticed answer as its remote description', id);
      
      // TODO: Ensure answer candidates are added my the `me` offering connection
      break;
    }
    default: {
      throw new Error(`Unexpected session description type '${sessionDescription.type}'.`);
    }
  }
}
