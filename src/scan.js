// TODO: Change this to an async iterator once browser support is there https://github.com/Fyrd/caniuse/issues/3690
export default function scan(onMessage) {
  const viewfinderVideo = document.querySelector('#viewfinderVideo');
  const viewfinderCanvas = document.querySelector('#viewfinderCanvas');
  const chunksP = document.querySelector('#chunksP');
  let viewfinderContext;
  const chunks = [];
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
        const [indexStr, countStr, text] = code.data.split('\0', 3);
        const index = Number(indexStr);
        const count = Number(countStr);
        if (chunks[index] === undefined) {
          chunks[index] = text;
          // Check the number of keys to ignore uninitialized array items
          if (Object.keys(chunks).length === count) {
            const message = chunks.join('');
            onMessage(message);
          }
        } else if (chunks[index] !== text) {
          // Reset scanning as we've found different chunks at the same index, the peer has probably changed
          chunks = [];
        }
        
        chunksP.innerHTML = Array(count).map(i => `<input type='checkbox' disabled${chunks[i] !== undefined ? 'checked' : ''} />`).join('');
      }
    }

    requestAnimationFrame(recognize);
  });
}
