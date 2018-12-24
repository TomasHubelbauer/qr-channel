import scan from './scan.js';
import broadcast from './broadcast.js';
import encode from './encode.js';
import decode from './decode.js';
import monitor from './monitor.js';
import test from './test.js';

window.addEventListener('load', async () => {
  const signalingStateP = document.querySelector('#signalingStateP');
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');
  const chunksP = document.querySelector('#chunksP');
  
  const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  viewfinderVideo.srcObject = mediaStream;
  // Set this attribute (not class member) through JavaScript (not HTML) to make iOS Safari work
  viewfinderVideo.setAttribute('playsinline', true);
  // Play within the `getUserMedia` gesture, `autoplay` won't work
  await viewfinderVideo.play();

  const chunks = [];
  scan((index, count, text) => {
    chunks[index] = text;
    chunksP.textContent = `Chunks (${Object.keys(chunks).length}/${count}): ` + Object.keys(chunks);
    // Check the number of keys to ignore uninitialized array items
    if (Object.keys(chunks).length === count) {
      // Fire and forget
      connect();
    }
  });
  
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
  
  // TODO: Handle both offer and answer cases
  // TODO: Rewrite this to be able to act on partial messages so that collection of chunks and establishment of the connection do not have to be strictly sequential
  async function connect() {
    const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    monitor(peerConnection, 'peerConnection');
    
    const dataChannel = peerConnection.createDataChannel('');
    monitor(dataChannel, 'dataChannel');
 
    const message = chunks.join('');
    const parts = message.split('\0');
    
    // TODO: Handle this possible being an answer to own offer and not different offer
    const offer = new RTCSessionDescription({ type: parts[0], sdp: parts[1] });
    await peerConnection.setRemoteDescription(offer);
    
    // TODO: Parse candidates from the groups of three items
    //for (const ) {
    //  const candidate = new RTCIceCandidate({ candidate: iceString, sdpMid: 0, sdpMLineIndex: 0 });
    //  await peerConnection.addIceCandidate(candidate);
    //}
    
    // TODO: Verify only a blank item was left (confirming we're at the end of the candidates)
    
    //const answer = await peerConnection.createAnswer();
    //await peerConnection.setLocalDescription(answer);
    
    alert('done');
  }
  
  await test();
});

window.addEventListener('unhandledrejection', event => alert(event.reason));
