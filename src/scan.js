// TODO: Change this to an async iterator once browser support is there https://github.com/Fyrd/caniuse/issues/3690
export default function scan(onChunk) {
  const viewfinderVideo = document.querySelector('#viewfinderVideo');
  const viewfinderCanvas = document.querySelector('#viewfinderCanvas');
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
        const [index, count, text] = code.data.split('\0', 3);
        onChunk(Number(index), Number(count), text);
      }
    }

    requestAnimationFrame(recognize);
  });
}
