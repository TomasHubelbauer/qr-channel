import decode from './decode.js';
import monitor from './monitor.js';

export default function reply(message) {
  if (message.startsWith('a=candidate:')) {
    throw new Error('TODO: Handle candidates');
  }
  
  const sessionDescription = decode(message);
  switch (sessionDescription.type) {
    case 'offer': {
      const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
      monitor(peerConnection, 'peerConnection');
      console.log('answering someone elses offer');
      // TODO: Discard my own offer
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
