import decode from './decode.js';
import monitor from './monitor.js';
import broadcast from './broadcast.js';
import identify from './identify.js';

// TODO: Finalize a mechanism for candidates reaching the right peer connection

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
    
    log('create welcome PC with DC, create O, sets O to LD, display O SDP&ICE, O-LD ID:', me.id);
    
    return;
  }
  
  if (message.startsWith('a=candidate:')) {
    const [sdp, id] = message.split('\n');
    
    // Ignore candidates from self, they belong to the peer
    if (id === me.id) {
      return;
    }

    log(`notice C from', id, 'md ID:', me.id, 'peer ID:', peerId, ', add C to PC, has RD:`, !!me.remoteDescription);
    
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
      
      log('otices O, abandon welcome PC with DC, create OC without DC, set O to RC, create A, set A to LD, display A SDP&ICE, peer ID:', peerId, 'me ID:', me.id);

      break;
    }
    case 'answer': {
      // Ignore an answer if we already have one
      if (me.remoteDescription !== null) {
        break;
      }
      
      const id = identify(sessionDescription);
            
      await me.setRemoteDescription(sessionDescription);
      
      log('notice A, set A to RD, me ID:', id);
      
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
