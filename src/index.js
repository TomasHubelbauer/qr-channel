import codingTest from './test/coding.js';
import codingTest2 from './test/coding2.js';
import replyingTest from './test/replying2.js';
//import scan from './scan.js';
import reply from './reply.js';

// TODO: Change the tests to be dynamic imports once Firefox supports them
window.addEventListener('load', async () => {
  // Use non-default logger when debugging on mobile
  //console.log = log;

  //await codingTest();
  await codingTest2();
  
  // Fire and forget infinite scanning for QR codes
  //scan(reply);
  
  // Start broadcasting my own welcome offer
  //reply();
  
  // Run the replying test
  //await replyingTest(reply);
});

window.addEventListener('unhandledrejection', event => alert(event.reason));
