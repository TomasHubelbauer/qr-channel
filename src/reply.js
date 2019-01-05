import decode from './decode.js';
import monitor from './monitor.js';
import broadcast from './broadcast.js';
import identify from './identify.js';
import melt from './melt.js';

let peerConnection;
let meId;
let peerId;
export default async function reply(message) {
  // Display the initial welcome offer which either will be replied to or replaced with a peer's offer
  if (message === undefined) {
    peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    window.offer = peerConnection;
    monitor(peerConnection, 'peerConnection', {
      onsignalingstatechange: event => event.currentTarget.signalingState,
      onicegatheringstatechange: event => event.currentTarget.iceGatheringState,
      onconnectionstatechange: event => event.currentTarget.connectionState,
      onicecandidate: event => event.candidate,
    });
    
    const dataChannel = peerConnection.createDataChannel('');
    monitor(dataChannel, 'dataChannel');
    
    const sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);
    
    meId = identify(peerConnection.localDescription);
    
    broadcast(peerConnection);
        
    return;
  }
  
  if (message.startsWith('a=candidate:')) {
    const candidate = melt(message, peerConnection.remoteDescription);
    if (candidate === undefined) {
      throw new Error('TODO: Handle this case');
    }
    
    const { sdp, id } = candidate;
    
    // Ignore candidates from self, they belong to the peer
    if (id === meId) {
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
    if (id === peerId) {
      await peerConnection.addIceCandidate(sdp);
    } else {
      // TODO: Store the candidate for to associate later if peer connection comes to avoid scanning it again (optimization)
      throw new Error();
    }
    
    return;
  }
  
  const sessionDescription = decode(message);
  const id = identify(sessionDescription);

  // Ignore the same offer scanned again
  if (peerId === id) {
    debugger;
    return;
  }

  // Ignore a new peer's offer in case we already have one
  if (peerId !== undefined) {
    debugger;
    return;
  }

  broadcast(undefined);
  peerId = id;
  switch (sessionDescription.type) {
    case 'offer': {
      peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      monitor(peerConnection, 'peerConnection', {
        onsignalingstatechange: event => event.currentTarget.signalingState,
        onicegatheringstatechange: event => event.currentTarget.iceGatheringState,
        onconnectionstatechange: event => event.currentTarget.connectionState,
        onicecandidate: event => event.candidate,
      });
      
      await peerConnection.setRemoteDescription(sessionDescription);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      meId = identify(peerConnection.localDescription);
      
      broadcast(peerConnection);
      
      break;
    }

    case 'answer': {
      await peerConnection.setRemoteDescription(sessionDescription);
      break;
    }

    default: {
      throw new Error(`Unexpected session description type '${sessionDescription.type}'.`);
    }
  }
}
