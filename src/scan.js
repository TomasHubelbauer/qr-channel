// TODO: Change this to an async iterator once browser support is there https://github.com/Fyrd/caniuse/issues/3690
export default async function scan(onMessage) {
  /** @type {HTMLVideoElement|null} */
  const viewfinderVideo = document.querySelector('#viewfinderVideo');
  if (viewfinderVideo === null) {
    throw new Error('The #viewfinderVideo element was not found.');
  }
  
  /** @type {HTMLCanvasElement|null} */
  const viewfinderCanvas = document.querySelector('#viewfinderCanvas');
  if (viewfinderCanvas === null) {
    throw new Error('The #viewfinderCanvas element was not found.');
  }
  
  /** @type {HTMLSelectElement|null} */
  const facingModeSelect = document.querySelector('#facingModeSelect');
  if (facingModeSelect === null) {
    throw new Error('The #facingModeSelect element was not found.');
  }
  
  let viewfinderContext;
  window.requestAnimationFrame(function recognize() {
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
        navigator.vibrate(100);
        onMessage(code.data);
      }
    }

    requestAnimationFrame(recognize);
  });
  
  const facingMode = localStorage['facingMode'] || 'user';
  await obtain(facingMode);
  
  // Note that duplicate handlers will be discarded so it's okay to add this every time
  facingModeSelect.addEventListener('change', onFacingModeSelectChange);
  facingModeSelect.value = facingMode;
}

async function onFacingModeSelectChange(event) {
  const facingMode = event.currentTarget.value;
  localStorage['facingMode'] = facingMode;
  await obtain(facingMode);
}

async function obtain(facingMode) {
  /** @type {HTMLVideoElement|null} */
  const viewfinderVideo = document.querySelector('#viewfinderVideo');
  if (viewfinderVideo === null) {
    throw new Error('The #viewfinderVideo element was not found.');
  }
  
  const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
  viewfinderVideo.srcObject = mediaStream;
  // Set this attribute (not class member) through JavaScript (not HTML) to make iOS Safari work
  viewfinderVideo.setAttribute('playsinline', '');
  // Play through JavaScript, `autoplay` doesn't seem to work
  await viewfinderVideo.play();
}
