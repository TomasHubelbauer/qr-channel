import scan from './scan.js';
import broadcast from './broadcast.js';
import encode from './encode.js';
import decode from './decode.js';

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
});

window.addEventListener('unhandledrejection', event => alert(event.reason));

async function rig() {
  const peerConnection1 = new RTCPeerConnection();
  monitor(peerConnection1, '1');
  const peerConnection2 = new RTCPeerConnection();
  monitor(peerConnection2, '2');
  
  const dataChannel = peerConnection1.createDataChannel(null);
  monitor(dataChannel, 'dc 1');
  
  const offerData = encode(await peerConnection1.createOffer());
  const offerCode = qrcode(0, 'L');
  offerCode.addData(JSON.stringify(offerData), 'Byte');
  offerCode.make();
  console.log(offerCode.createDataURL(10, 10));
  const offer = decode(offerData);
  await peerConnection1.setLocalDescription(offer);
  await peerConnection2.setRemoteDescription(offer);
  const answerData = encode(await peerConnection2.createAnswer());
  const answerCode = qrcode(0, 'L');
  answerCode.addData(JSON.stringify(answerData), 'Byte');
  answerCode.make();
  console.log(answerCode.createDataURL(10, 10));
  const answer = decode(answerData);
  await peerConnection2.setLocalDescription(answer);
  await peerConnection1.setRemoteDescription(answer);
  
  peerConnection1.addEventListener('icecandidate', event => {
    if (event.candidate !== null) {
      peerConnection2.addIceCandidate(event.candidate);
    }
  });
  
  peerConnection2.addEventListener('icecandidate', event => {
    if (event.candidate !== null) {
      peerConnection1.addIceCandidate(event.candidate);
    }
  });
  
  dataChannel.addEventListener('open', () => {
    dataChannel.send('message from 1 to 2');
  });
  
  dataChannel.addEventListener('message', event => {
    alert('2: ' + event.data);
  });
  
  peerConnection2.addEventListener('datachannel', event => {
    monitor(event.channel, 'dc 2');
    event.channel.addEventListener('open', () => {
      event.channel.send('message from 2 to 1');
    });
    
    event.channel.addEventListener('message', event => {
      alert('1: ' + event.data);
    });
  });
}

function monitor(obj, label) {
  for (const key in obj) {
    if (!/^on/.test(key)) {
      continue;
    }

    obj.addEventListener(key.slice(2), event => console.log(label, key, event));
  }
}

rig();
