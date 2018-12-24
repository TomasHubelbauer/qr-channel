window.addEventListener('load', async () => {
  const viewfinderVideo = document.querySelector('#viewfinderVideo');
  const viewfinderCanvas = document.querySelector('#viewfinderCanvas');
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
  const scanner = new Scanner(viewfinderVideo, viewfinderCanvas, (index, count, text) => {
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

const vLineRegex = /^v=0$/g;
const oLineRegex = /^o=.* (\d+) \d+ IN IP4 \d+.\d+.\d+.\d+$/g;
const sLineRegex = /^s=-$/g;
const tLineRegex = /^t=0 0$/g;
const aFingerprintLineRegex = /^a=fingerprint:sha-256 (([0-9a-fA-F]{2}:){31}[0-9a-fA-F]{2})$/g;
const aGroupLineRegex = /^a=group:BUNDLE (\w+)$/g;
const aIceOptionsLineRegex = /^a=ice-options:trickle$/g;
const aMsidSemanticLineRegex = /^a=msid-semantic:\s?WMS(\s\*)?$/g;
const mLineRegex = /^m=application 9 (UDP\/DTLS\/SCTP webrtc-datachannel|DTLS\/SCTP 5000)$/g;
const cLineRegex = /^c=IN IP4 0\.0\.0\.0$/g;
const aSendRecvLineRegex = /^a=sendrecv$/;
const aIceUfragLineRegex = /^a=ice-ufrag:(.*)$/g;
const aIcePwdLineRegex = /^a=ice-pwd:(.*)$/g;
const aMidLineRegex = /^a=mid:(0|data)$/g;
const aSetupLineRegex = /^a=setup:(actpass|active)$/g;
const aMaxMessageSizeLineRegex = /^a=max-message-size:\d+$/g;
const aSctpPortLineRegex = /^a=sctp-port:5000$/g;
const aSctpMapLineRegex = /^a=sctpmap:5000 webrtc-datachannel 1024$/g;

// Encodes SDP + ICE candidates into a QR alphanumeric string
// TODO: Finalize compressing and escaping
function encode(sdp) {
  if (sdp.type !== 'offer' && sdp.type !== 'answer') {
    throw new Error(`Can only handle offer and answer session descriptions`);
  }
  
  const data = { type: sdp.type };
  let match;
  for (const line of sdp.sdp.split(/\r\n/g)) {
    if ((match = vLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = oLineRegex.exec(line)) !== null) {
      data.id = match[1];
    } else if ((match = sLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = tLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = aFingerprintLineRegex.exec(line)) !== null) {
      // TODO: Remove the colons and figure out how to handle case (escaping)
      data.hash = match[1];
    } else if ((match = aGroupLineRegex.exec(line)) !== null) {
      // Ignore, we hardcode mid name to dash
    } else if ((match = aIceOptionsLineRegex.exec(line)) !== null) {
       // Ignore, no data
    } else if ((match = aMsidSemanticLineRegex.exec(line)) !== null) {
       // Ignore, browsers set different values (Chrome ` WMS`, Firefox `WMS *`), but `WMS` works for both
    } else if ((match = mLineRegex.exec(line)) !== null) {
      switch (match[1]) {
        case 'UDP/DTLS/SCTP webrtc-datachannel': data.media = 'firefox'; break;
        case 'DTLS/SCTP 5000': data.media = 'chrome'; break;
        default: throw new Error(`Unexpected media line value '${match[1]}'.`);
      }
    } else if ((match = cLineRegex.exec(line)) !== null) {
       // Ignore, no data
    } else if ((match = aSendRecvLineRegex.exec(line)) !== null) {
      // Ignore, optional (Firefox only)
    } else if ((match = aIceUfragLineRegex.exec(line)) !== null) {
      data.ufrag = match[1];
    } else if ((match = aIcePwdLineRegex.exec(line)) !== null) {
      // TODO: See if knowing that for Firefox this is a serialized GUID we could make assumptions about case and save escaping
      data.pwd = match[1];
    } else if ((match = aMidLineRegex.exec(line)) !== null) {
      // Ignore, we hardcode mid name to dash
    } else if ((match = aSetupLineRegex.exec(line)) !== null) {
      // Ignore, deriveable from type
    } else if ((match = aMaxMessageSizeLineRegex.exec(line)) !== null) {
      // Ignore, optional (Firefox only)
    } else if ((match = aSctpPortLineRegex.exec(line)) !== null) {
      // Ignore, deriveable from media
    } else if ((match = aSctpMapLineRegex.exec(line)) !== null) {
      // Ignore, deriveable from media
    } else if (line === '') {
      // Ignore, no data
    } else if (line === 'b=AS:30') {
      // Ignore, random (Chrome only)
    } else {
      throw new Error(`Unexpected SDP line '${line}'.`);
    }
  }
  
  return data;
}

// Decodes SDP + ICE candidates from a QR alphanumeric string
// TODO: Finalize decompressing and unescaping
function decode(data) {
  return new RTCSessionDescription({
    type: data.type,
    sdp: [
      'v=0',
      `o=- ${data.id} 0 IN IP4 0.0.0.0`,
      's=-',
      't=0 0',
      `a=fingerprint:sha-256 ${data.hash}`,
      `a=group:BUNDLE 0`,
      'a=ice-options:trickle',
      'a=msid-semantic:WMS',
      `m=application 9 ${data.media === 'firefox' ? 'UDP/DTLS/SCTP webrtc-datachannel' : ''}${data.media === 'chrome' ? 'DTLS/SCTP 5000' : ''}`,
      'c=IN IP4 0.0.0.0',
      `a=ice-ufrag:${data.ufrag}`,
      `a=ice-pwd:${data.pwd}`,
      'a=mid:0',
      `a=setup:${data.type === 'offer' ? 'actpass' : ''}${data.type === 'answer' ? 'active' : ''}`,
      `a=sctp${data.media === 'firefox' ? '-port:5000' : ''}${data.media === 'chrome' ? 'map:5000 webrtc-datachannel 1024' : ''}`,
      '',
    ].join('\r\n'),
  });
}

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
      this.codeCanvas.title = chunk;

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

class Scanner {
  constructor(viewfinderVideo, viewfinderCanvas, onChunk) {
    this.viewfinderVideo = viewfinderVideo;
    this.viewfinderCanvas = viewfinderCanvas;
    this.onChunk = onChunk;
    window.requestAnimationFrame(this.scan);
  }
  
  scan() {
    if (this.viewfinderVideo.readyState === this.viewfinderVideo.HAVE_ENOUGH_DATA) {
      if (this.viewfinderCanvas.width !== this.viewfinderVideo.videoWidth || this.viewfinderCanvas.height !== this.viewfinderVideo.videoHeight) {
        this.viewfinderCanvas.width = this.viewfinderVideo.videoWidth;
        this.viewfinderCanvas.height = this.viewfinderVideo.videoHeight;
        this.viewfinderContext = this.viewfinderCanvas.getContext('2d');
      }

      this.viewfinderContext.drawImage(this.viewfinderVideo, 0, 0, this.viewfinderVideo.videoWidth, this.viewfinderVideo.videoHeight);
      const imageData = this.viewfinderContext.getImageData(0, 0, this.viewfinderCanvas.width, this.viewfinderCanvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code !== null && code.data !== '') {
        const [index, count, text] = code.data.split('\0', 3);
        this.onChunk(Number(index), Number(coubt), text);
      }
    }

    requestAnimationFrame(this.scan);
  }
}

class Coder {
  // TODO: Move encoding and decoding here, regexes to static class fields
}
