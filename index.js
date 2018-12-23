window.addEventListener('load', async () => {
  const viewfinderVideo = document.querySelector('#viewfinderVideo');
  const viewfinderCanvas = document.querySelector('#viewfinderCanvas');
  const codeCanvas = document.querySelector('#codeCanvas');
  const signalingStateP = document.querySelector('#signalingStateP');
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');
  const chunksP = document.querySelector('#chunksP');

   // Remember the context and refresh it when dimensions change
  let codeContext;
  
  const chunks = [];
  
  const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  viewfinderVideo.srcObject = mediaStream;
  // Set this attribute (not class member) through JavaScript (not HTML) to make iOS Safari work
  viewfinderVideo.setAttribute('playsinline', true);
  // Play within the `getUserMedia` gesture, `autoplay` won't work
  await viewfinderVideo.play();

  // Remember the context and refresh it when dimensions change
  let viewfinderContext;
  requestAnimationFrame(function tick() {
    if (viewfinderVideo.readyState === viewfinderVideo.HAVE_ENOUGH_DATA) {
      if (viewfinderCanvas.width !== viewfinderVideo.videoWidth || viewfinderCanvas.height !== viewfinderVideo.videoHeight) {
        viewfinderCanvas.width = viewfinderVideo.videoWidth;
        viewfinderCanvas.height = viewfinderVideo.videoHeight;
        viewfinderContext = viewfinderCanvas.getContext('2d');
      }

      viewfinderContext.drawImage(viewfinderVideo, 0, 0, viewfinderVideo.videoWidth, viewfinderVideo.videoHeight);
      const imageData = viewfinderContext.getImageData(0, 0, viewfinderCanvas.width, viewfinderCanvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code !== null && code.data !== '') {
        const [index, count, text] = code.data.split('\0', 3);
        chunks[index] = text;
        chunksP.textContent = `Chunks (${Object.keys(chunks).length}/${count}): ` + Object.keys(chunks);
        // Check the number of keys to ignore uninitialized array items
        if (Object.keys(chunks).length === Number(count)) {
          // Fire and forget
          connect();
        }
      }
    }

    requestAnimationFrame(tick);
  });
  
  let message = '';
  
  const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
  for (const key in peerConnection) {
    if (!/^on/.test(key)) {
      continue;
    }

    peerConnection.addEventListener(key.slice(2), event => console.log('peerConnection', key, event));
  }
  
  peerConnection.addEventListener('signalingstatechange', () => {
    signalingStateP.textContent += peerConnection.signalingState + '; ';
  });
  
  peerConnection.addEventListener('icegatheringstatechange', () => {
    iceGatheringStateP.textContent += peerConnection.iceGatheringState + '; ';
  });
  
  peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate !== null) {
      
      message += event.candidate.candidate + '\0' + event.candidate.sdpMid + '\0' + event.candidate.sdpMLineIndex + '\0';
    } else {
      message += '\0';
      console.log(JSON.stringify(message));
    }
  });

  const dataChannel = peerConnection.createDataChannel('');
  for (const key in dataChannel) {
    if (!/^on/.test(key)) {
      continue;
    }
    
    dataChannel.addEventListener(key.slice(2), event => console.log('dataChannel', key, event));
  }
  
  // Start from -1 so that 0 falls on the non-empty message value (with SDP or ICE candidate SDP in it)
  let counter = -1;
  // TODO: Derive this not from char length but from the type number (have it not be automatic)
  const size = 50;
  
  // Fire and forget
  rotate();

  // Fire and forget so that we can keep looping messages
  broadcast();
  
  async function broadcast() {
    const sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);
    message += sessionDescription.type + '\0' + sessionDescription.sdp + '\0';
  }
  
  // TODO: Handle both offer and answer cases
  // TODO: Rewrite this to be able to act on partial messages so that collection of chunks and establishment of the connection do not have to be strictly sequential
  async function connect() {
    const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    for (const key in peerConnection) {
      if (!/^on/.test(key)) {
        continue;
      }

      peerConnection.addEventListener(key.slice(2), event => console.log('peerConnection', key, event));
    }
    
    const dataChannel = peerConnection.createDataChannel('');
    for (const key in dataChannel) {
      if (!/^on/.test(key)) {
        continue;
      }

      dataChannel.addEventListener(key.slice(2), event => console.log('dataChannel', key, event));
    }
 
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
  
  async function rotate() {
    while (true) {
      const count = Math.ceil(message.length / size);
      const index = counter % count;
      const code = message.substr(index * size, size);
      //console.log({ counter, count, index, message, messageLength: message.length, code, codeLength: code.length });
      displayMessage(`${index}\0${count}\0${code}`);
      await new Promise((resolve, reject) => window.setTimeout(resolve, 100));
      counter++;
    }
  }
    
  function displayMessage(message) {
    const qr = qrcode(0, 'L');
    qr.addData(message, 'Byte');
    qr.make();
    codeCanvas.title = message;

    const { width, height } = codeCanvas.getBoundingClientRect();
    if (codeCanvas.width !== width || codeCanvas.height !== height) {
      codeCanvas.width = width;
      codeCanvas.height = height;
      codeContext = codeCanvas.getContext('2d');
    } else {
      codeContext.clearRect(0, 0, codeCanvas.width, codeCanvas.height);
    }

    const size = Math.min(codeCanvas.width, codeCanvas.height);
    const moduleCount = qr.getModuleCount();
    const cellSize = size / moduleCount;
    const ceilSize = Math.ceil(cellSize);

    const x = (width - size) / 2;
    const y = (height - size) / 2;
    for (let cellX = 0; cellX < moduleCount; cellX++) {
      for (let cellY = 0; cellY < moduleCount; cellY++) {
        if (qr.isDark(cellX, cellY)) {
          codeContext.fillRect(x + cellX * cellSize, y + cellY * cellSize, ceilSize, ceilSize);
        }
      }
    }
  }
});

window.addEventListener('unhandledrejection', event => alert(event.reason));

// Encodes SDP + ICE candidates into a QR alphanumeric string
function encode(sdp) {
  // TYPE bit (offer/answer)
  // 
  
  return ``;
}

// Decodes SDP + ICE candidates from a QR alphanumeric string
function decode(value) {
  return {
    type: 'offer', // TODO: Or answer,
    sdp: 'v=0\r\n',
  };
}
