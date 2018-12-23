window.addEventListener('load', async () => {
  const viewfinderVideo = document.querySelector('#viewfinderVideo');
  const viewfinderCanvas = document.querySelector('#viewfinderCanvas');
  const codeCanvas = document.querySelector('#codeCanvas');

   // Remember the context and refresh it when dimensions change
  let codeContext;
  
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
        alert(code.data);
      }
    }

    requestAnimationFrame(tick);
  });
  
  const peerConnection = new RTCPeerConnection();
  for (const key in peerConnection) {
    if (!/^on/.test(key)) {
      return;
    }

    console.log(key);
    peerConnection.addEventListener(key.slice(2), event => console.log('peerConnection', key, event));
  }

  const dataChannel = peerConnection.createDataChannel('');
  for (const key in dataChannel) {
    if (!/^on/.test(key)) {
      return;
    }
    
    console.log(key);
    dataChannel.addEventListener(key.slice(2), event => console.log('dataChannel', key, event));
  }
  
  // Fire and forget so that we can keep looping messages
  broadcast();
  
  while (true) {
    const message = Date.now().toString();
    displayMessage(message);
    await new Promise((resolve, reject) => window.setTimeout(resolve, 1000));
  }
  
  async function broadcast() {
    const sessionDescription = await peerConnection.createOffer();
    console.log(sessionDescription);
  }
    
  function displayMessage(message) {
    const qr = qrcode(1, 'L');
    qr.addData(message, 'Numeric');
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
