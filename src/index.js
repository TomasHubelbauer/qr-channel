import scan from './scan.js';
import broadcast from './broadcast.js';
import monitor from './monitor.js';
import test from './test.js';
import reply from './reply.js';

window.addEventListener('load', async () => {
  await test();
  
  // Fire and forget infinite scanning for QR codes
  scan(async message => await reply(message));
  
  // Start broadcasting my own welcome offer
  reply();
});

window.addEventListener('unhandledrejection', event => alert(event.reason));
