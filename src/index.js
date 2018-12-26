import codingTest from './test/coding.js';
//import replyingTest from './test/replying.js';
//import scan from './scan.js';
//import reply from './reply.js';

window.addEventListener('load', async () => {
  await codingTest();
  
  // Fire and forget infinite scanning for QR codes
  //scan(reply);
  
  // Start broadcasting my own welcome offer
  //reply();
  
  // Run the replying test
  //replyingTest(reply);
});

window.addEventListener('unhandledrejection', event => alert(event.reason));
