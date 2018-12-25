import decode from './decode.js';
import monitor from './monitor.js';
import broadcast from './broadcast.js';
import identify from './identify.js';

// TODO: Fix the A candidates never reaching B because we fight over one QR code not two, the test should simulate 2 or use a frame
// TODO: Find a way to make sure the candidates reach the right peer connection

let me;
let peer;
export default async function reply(message) {
  // Display the initial welcome offer which either will be replied to or replaced with a peer's offer
  if (message === undefined) {
    me = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    monitor(me, 'peerConnection');
    
    const dataChannel = me.createDataChannel(null);
    monitor(dataChannel, 'dataChannel');
    
    log('Creates a peer connection with a data channel');

    const sessionDescription = await me.createOffer();
    await me.setLocalDescription(sessionDescription);
    
    me.id = identify(me.localDescription);
    
    log('Creates an offer and sets it as its local description', identify(me.localDescription));
    
    broadcast(me);
    
    log('Displays the offer SDP and its ICE candidate SDPs', identify(me.localDescription));
    
    return;
  }
  
  if (message.startsWith('a=candidate:')) {
    const [sdp, id] = message.split('\n');
    
    log('Receives candidate from connection with offer/answer', id);
    
    // Ignore candidates from self, they belong to the peer
    if (id === me.id) {
      log('Ignores own candidate');
      return;
    }

    log(`Notices candidate SDP and adds the ICE candidate to its peer connection`);
    
    if (undefined !== undefined) {
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
      
      // Ignore an offer in case we're already answering to any
      if (peer !== undefined) {
        break;
      }
      
      log('Notices the offer SDP', id);

      peer = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      monitor(peer, 'peerConnection');
      
      log('Creates a peer connection without a data channel');
      
      await peer.setRemoteDescription(sessionDescription);
      
      log('Sets the noticed offer as its remote description', id);
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      peer.id = identify(peer.localDescription);
      
      log('Creates an answer and sets it to its local description', identify(peer.localDescription));
      
      broadcast(peerConnection);
      
      log('Displays the answer SDP and its ICE candidate SDPs', identify(peer.localDescription));
      
      break;
    }
    case 'answer': {
      // Ignore an answer if we already have one
      if (me.remoteDescription !== null) {
        break;
      }
      
      const id = identify(sessionDescription);
      
      log('Notices the answer SDP', id);
            
      await me.setRemoteDescription(sessionDescription);
      
      log('Sets the noticed answer as its remote description', id);
      
      // TODO: Ensure answer candidates are added my the `me` offering connection
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
