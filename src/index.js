import scan from './scan.js';
import broadcast from './broadcast.js';
import monitor from './monitor.js';
import test from './test.js';
import reply from './reply.js';

window.addEventListener('load', async () => {
  await test();
  
  scan(async message => await reply(message));
  
  const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  viewfinderVideo.srcObject = mediaStream;
  // Set this attribute (not class member) through JavaScript (not HTML) to make iOS Safari work
  viewfinderVideo.setAttribute('playsinline', true);
  // Play through JavaScript, `autoplay` doesn't seem to work
  await viewfinderVideo.play();

  reply();
});

window.addEventListener('unhandledrejection', event => alert(event.reason));
