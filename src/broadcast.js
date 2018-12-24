export default async function broadcast(peerConnection) {
  const codeCanvas = document.querySelector('#codeCanvas');
  let codeContext;
  let counter = 0;
  // TODO: Use a fixed chunk size derived from a set QR code type number chosen based on the screen size (big desktop, small mobile)
  const size = 50;
  while (true) {
    // Show local first and remove last to ensure correct flow order
    const message = (peerConnection.remoteDescription || peerConnection.localDescription).sdp;
    const count = Math.ceil(message.length / size);
    const index = counter % count;
    const code = message.substr(index * size, size);
    const chunk = `${index}\0${count}\0${code}`;
    counter++;

    const qr = qrcode(0, 'L');
    qr.addData(chunk, 'Byte');
    qr.make();
    codeCanvas.title = code;

    const { width, height } = codeCanvas.getBoundingClientRect();
    if (codeCanvas.width !== width || codeCanvas.height !== height) {
      codeCanvas.width = width;
      codeCanvas.height = height;
      codeContext = codeCanvas.getContext('2d');
    } else {
      codeContext.clearRect(0, 0, codeCanvas.width, codeCanvas.height);
    }

    const moduleCount = qr.getModuleCount();
    const cellSize = Math.min(codeCanvas.width, codeCanvas.height) / moduleCount;
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

    await new Promise(resolve => window.setTimeout(resolve, 100));
  }
}
