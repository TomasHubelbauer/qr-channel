import scan from './scan.js';
import broadcast from './broadcast.js';
import monitor from './monitor.js';
import test from './test.js';
import reply from './reply.js';

window.addEventListener('load', async () => {
  await test();
  
  const signalingStateP = document.querySelector('#signalingStateP');
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');

  scan(async message => await reply(message));
  
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
});

window.addEventListener('unhandledrejection', event => alert(event.reason));
