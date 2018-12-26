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
    
    const dataChannel = me.createDataChannel('');
    monitor(dataChannel, 'dataChannel');
    
    const sessionDescription = await me.createOffer();
    await me.setLocalDescription(sessionDescription);
    
    me.id = identify(me.localDescription);
    
    broadcast(me);
    
    log('create welcome PC with DC, create O, sets O to LD, display O SDP&ICE, me O-LD ID:', me.id);
    
    return;
  }
  
  if (message.startsWith('a=candidate:')) {
    const [sdp, id] = message.split('\n');
    
    // Ignore candidates from self, they belong to the peer
    if (id === me.id) {
      return;
    }
    
    // TODO: Handle this case:
    // - A created a welcome offer #1
    // - B created a welcome offer #2
    // - A noticed B's welcome offer #2
    // - B noticed A's welcome offer #1
    // - A abandoned welcome offer #1 and created an answer for B #3
    // - B abandoned welcome offer #2 and creared an answer for A #4
    // - A notices a candidate from the answer #4 but it remembers the peer to be #2
    // - A does not know what to do with the candidate from an unknown peer
    //   but also can't acdept the answer #4 because it has RD - the offer #2
    // Maybe the answer #4 should communicate it replaces the offer #2 or something?
    // For now the check in the answer branch could is set to discard just if there is an answer already, not an offer
    // This uses an error to be thrown: `InvalidStateError: Cannot set remote answer in state stable`
    // The reason for that is that the answer received there should be for the welcome PC, not the other one (I think)
    log('notice C from', id, 'me ID:', me.id, 'peer ID:', peerId, ', add C to PC, has RD:', !!me.remoteDescription);
    
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
      
      // Ignore the same offer scanned again
      if (peerId === id) {
        break;
      }
      
      // Ignore a new peer's offer in case we already have one
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
      
      log('notice O, abandon welcome PC with DC, create PC without DC, set O to RD, create A, set A to LD, display A SDP&ICE, peer ID:', peerId, 'me A-LD ID:', me.id);

      break;
    }
    case 'answer': {
      // Ignore an answer if we already have one
      if (me.remoteDescription.type === 'answer') {
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
