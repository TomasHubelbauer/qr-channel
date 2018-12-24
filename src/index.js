impprt scan from './scan.js';
import encode from './encode.js';
import decode from './decode.js';

window.addEventListener('load', async () => {
  const codeCanvas = document.querySelector('#codeCanvas');
  const signalingStateP = document.querySelector('#signalingStateP');
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');
  const chunksP = document.querySelector('#chunksP');

   // Remember the context and refresh it when dimensions change
  let codeContext;
  
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
  const chunker = new Chunker(peerConnection, codeCanvas);
  
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

class Chunker {
  constructor(peerConnection, codeCanvas) {
    this.peerConnection = peerConnection;
    this.codeCanvas = codeCanvas;
    this.counter = 0;
    // Fire and forget
    this.rotate();
  }
  
  async rotate() {
    // TODO: Wait only until the class exists, we'll `delete` it once we have established the peer connection
    while (true) {
      // Show local first and remove last to ensure correct flow order
      const message = (this.peerConnection.remoteDescription || this.peerConnection.localDescription).sdp;
      const count = Math.ceil(message.length / Chunker.SIZE);
      const index = this.counter % count;
      const code = message.substr(index * Chunker.SIZE, Chunker.SIZE);
      const chunk = `${index}\0${count}\0${code}`;
      this.counter++;

      const qr = qrcode(0, 'L');
      qr.addData(chunk, 'Byte');
      qr.make();
      this.codeCanvas.title = code;

      const { width, height } = this.codeCanvas.getBoundingClientRect();
      if (this.codeCanvas.width !== width || this.codeCanvas.height !== height) {
        this.codeCanvas.width = width;
        this.codeCanvas.height = height;
        this.codeContext = this.codeCanvas.getContext('2d');
      } else {
        this.codeContext.clearRect(0, 0, this.codeCanvas.width, this.codeCanvas.height);
      }

      const size = Math.min(this.codeCanvas.width, this.codeCanvas.height);
      const moduleCount = qr.getModuleCount();
      const cellSize = size / moduleCount;
      const ceilSize = Math.ceil(cellSize);

      const x = (width - size) / 2;
      const y = (height - size) / 2;
      for (let cellX = 0; cellX < moduleCount; cellX++) {
        for (let cellY = 0; cellY < moduleCount; cellY++) {
          if (qr.isDark(cellX, cellY)) {
            this.codeContext.fillRect(x + cellX * cellSize, y + cellY * cellSize, ceilSize, ceilSize);
          }
        }
      }
      
      await new Promise(resolve => window.setTimeout(resolve, 100));
    }
  }
}

// TODO: Use a fixed chunk size derived from a set QR code type number chosen based on the screen size (big desktop, small mobile)
Chunker.SIZE = 50;
