import decode from './decode.js';
import monitor from './monitor.js';

const peerConnections = {};

export default async function reply(message) {
  const typeP = document.querySelector('#typeP');
  const signalingStateP = document.querySelector('#signalingStateP');
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');

  // Display the initial welcome offer which either will be replied to or replaced with a peer's offer
  if (message === undefined) {
    const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    monitor(peerConnection, 'peerConnection');

    peerConnection.addEventListener('signalingstatechange', () => signalingStateP.textContent += peerConnection.signalingState + '; ');
    peerConnection.addEventListener('icegatheringstatechange', () => iceGatheringStateP.textContent += peerConnection.iceGatheringState + '; ');

    const dataChannel = peerConnection.createDataChannel(null);
    monitor(dataChannel, 'dataChannel');

    const sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);

    // Start rotating now that we have SDP
    broadcast(peerConnection);
  }
  
  if (message.startsWith('a=candidate:')) {
    // TODO: Figure out what peer connection the candidate belongs to from the session ID (add it to the candidate QR code)
    const sessionId = 'todo';
    const peerConnection = peerConnections[sessionId];
    if (peerConnection !== undefined) {
      // TODO: Ignore the candidate if it already has been added unless it is safe to add duplicate candidates
      const candidate = null;
      await peerConnection.addIceCandidate();
    } else {
      // TODO: Store the canndidate for if the connection comes later
    }
    
    return;
  }
  
  const sessionDescription = decode(message);
  switch (sessionDescription.type) {
    case 'offer': {
      // TODO: Discard own offering peer connection
      const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      const sessionId = 'todo';
      peerConnections[sessionId] = peerConnection;
      monitor(peerConnection, 'peerConnection');
      
      // TODO: Broadcast this new peer connection so that we start showing the answer and its candidates
      
      await peerConnection.setRemoteDescription(sessionDescription);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // TODO: Wait for the data channel event and its opening event
      console.log('Waiting for the data channel');
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
