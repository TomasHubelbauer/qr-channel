import scan from './scan.js';
import broadcast from './broadcast.js';
import encode from './encode.js';
import decode from './decode.js';
import monitor from './monitor.js';
import test from './test.js';

window.addEventListener('load', async () => {
  await test();
  return;
  
  const signalingStateP = document.querySelector('#signalingStateP');
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');

  scan(async message => await connect(decode(message)));
  
  const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  viewfinderVideo.srcObject = mediaStream;
  // Set this attribute (not class member) through JavaScript (not HTML) to make iOS Safari work
  viewfinderVideo.setAttribute('playsinline', true);
  // Play through JavaScript, `autoplay` doesn't seem to work
  await viewfinderVideo.play();

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
  
  // TODO: Rewrite this to be able to act on partial messages so that collection of chunks and establishment of the connection do not have to be strictly sequential
  async function connect(sdp) {
    const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    monitor(peerConnection, 'peerConnection');

    switch (sdp.type) {
      case 'offer': {
        break;
      }
      case 'answer': {
        break;
      }
      default: {
        throw new Error(`Unexpected SDP type '${sdp.type}'.`);
      }
    }

    // TODO: Finalize this logic
  }
});

window.addEventListener('unhandledrejection', event => alert(event.reason));
