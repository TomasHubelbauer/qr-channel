import decode from './decode.js';
import monitor from './monitor.js';
import broadcast from './broadcast.js';
import identify from './identify.js';

// TODO: Fix the A candidates never reaching B because we fight over one QR code not two, the test should simulate 2 or use a frame
// TODO: Find a way to make sure the candidates reach the right peer connection

let me;
let peerId;
export default async function reply(message) {
  // Display the initial welcome offer which either will be replied to or replaced with a peer's offer
  if (message === undefined) {
    me = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    monitor(me, 'peerConnection');
    
    const dataChannel = me.createDataChannel(null);
    monitor(dataChannel, 'dataChannel');
    
    const sessionDescription = await me.createOffer();
    await me.setLocalDescription(sessionDescription);
    
    me.id = identify(me.localDescription);
    
    broadcast(me);
    
    log('Creates a welcome peer connection with a data channel, an offer, sets if as its local description and displays its SDP and ICE');
    
    return;
  }
  
  if (message.startsWith('a=candidate:')) {
    const [sdp, id] = message.split('\n');
    
    // Ignore candidates from self, they belong to the peer
    if (id === me.id) {
      return;
    }

    log(`Notices candidate from', id, 'own ID is', me.id, 'peer ID is', peerId, 'and adds the ICE candidate to its peer connection maybe`, me.remoteDescription);
    
    // TODO: me.remoteDescription / peerId
    if (undefined !== undefined) {
      // Avoid adding the candidate multiple times
      if (!me.remoteDescription.sdp.split(/\r\n/g).includes(sdp)) {
        await me.addIceCandidate(new RTCIceCandidate({ candidate: sdp, sdpMid: "0", sdpMLineIndex: 0 }));
      }
    } else {
      // TODO: Store the candidate for if later its associated peer connection comes so we don't have to scan it again
    }
    
    return;
  }
  
  const sessionDescription = decode(message);
  switch (sessionDescription.type) {
    case 'offer': {
      const id = identify(sessionDescription);
      
      // Ignore an offer in case we're already answering to any
      if (peerId !== undefined) {
        break;
      }
      
      peerId = id;
      
      me = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      monitor(me, 'peerConnection');
      
      await me.setRemoteDescription(sessionDescription);
      
      const answer = await me.createAnswer();
      await me.setLocalDescription(answer);
      
      me.id = identify(me.localDescription);
      
      broadcast(me);
      
      log('Notices the offer SDP, abandons the welcome peer connection with a data channel, creates a peer connection without a data channel, ets the noticed offer as its remote description, creates an answer and sets it to its local description, displays the answer SDP and its ICE candidate SDPs. Peer ID', peerId, 'me ID', me.id);

      break;
    }
    case 'answer': {
      // Ignore an answer if we already have one
      if (me.remoteDescription !== null) {
        break;
      }
      
      const id = identify(sessionDescription);
            
      await me.setRemoteDescription(sessionDescription);
      
      log('Notices the answer SDP, sets the noticed answer as its remote description', id);
      
      break;
    }
    default: {
      throw new Error(`Unexpected session description type '${sessionDescription.type}'.`);
    }
  }
}

function log(...args) {
  console.log(window.location.hash.slice(1), ...args);
}
