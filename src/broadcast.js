import encode from './encode.js';

let peerConnection;
export default function broadcast(connection) {
  // Stop the existing rotation by clearing the session description
  if (connection === undefined) {
    peerConnection = undefined;
    return;
  }
  
  /** @type {!HTMLParagraphElement} */
  const typeP = document.querySelector('#typeP');
  /** @type {!HTMLParagraphElement} */
  const signalingStateP = document.querySelector('#signalingStateP');
  /** @type {!HTMLParagraphElement} */
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');

  if (peerConnection === undefined) {
    peerConnection = connection;
    // Fire and forget a rotation in an independent flow
    rotate();
  } else {
    // Replace and reuse the existing rotation
    peerConnection = connection;
  }
  
  typeP.textContent += ' → ' + peerConnection.localDescription.type;
  peerConnection.addEventListener('signalingstatechange', () => signalingStateP.textContent += ' → ' + peerConnection.signalingState);
  peerConnection.addEventListener('icegatheringstatechange', () => iceGatheringStateP.textContent += ' → ' + peerConnection.iceGatheringState);
}

async function rotate() {
  const codeCanvas = document.querySelector('#codeCanvas');
  let codeContext;
  let counter = 0;
  while (peerConnection !== undefined) {
    // Note that this is updated in any iteration to capture new candidates as they come
    const { sdp, ices } = encode(peerConnection.localDescription); // Use local description always (offer or answer)
    const count = 1 + ices.length;
    const index = counter % count;
    let message;
    let mode;
    if (index === 0) {
      message = sdp;
      mode = 'Alphanumeric';
    } else {
      message = ices[index - 1];
      mode = 'Byte';
    }
    
    const qr = qrcode(0, 'L');
    qr.addData(message, mode);
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

    const length = Math.min(width, height);
    const moduleCount = qr.getModuleCount();
    const cellSize = length / moduleCount;
    const ceilSize = Math.ceil(cellSize);
    const x = (width - length) / 2;
    const y = (height - length) / 2;
    for (let cellX = 0; cellX < moduleCount; cellX++) {
      for (let cellY = 0; cellY < moduleCount; cellY++) {
        if (qr.isDark(cellX, cellY)) {
          codeContext.fillRect(x + cellX * cellSize, y + cellY * cellSize, ceilSize, ceilSize);
        }
      }
    }

    counter++;
    await new Promise(resolve => window.setTimeout(resolve, 250));
  }
}
