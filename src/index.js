import test from './test.js';
import scan from './scan.js';
import reply from './reply.js';

window.addEventListener('load', async () => {
  //await test();
  
  // Fire and forget infinite scanning for QR codes
  scan(reply);
  
  // Start broadcasting my own welcome offer
  reply();
});

window.addEventListener('unhandledrejection', event => alert(event.reason));
