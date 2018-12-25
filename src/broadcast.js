import encode from './encode.js';

let sessionDescription;
export default function broadcast(peerConnection) {
  // Stop the existing rotation by clearing the session description
  if (peerConnection === undefined) {
    // TODO: See if I can use `delete` here
    sessionDescription = undefined;
    return;
  }
  
  const typeP = document.querySelector('#typeP');
  const signalingStateP = document.querySelector('#signalingStateP');
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');

  typeP.textContent += ' → ' + peerConnection.localDescription.type;
  peerConnection.addEventListener('signalingstatechange', () => signalingStateP.textContent += ' → ' + peerConnection.signalingState);
  peerConnection.addEventListener('icegatheringstatechange', () => iceGatheringStateP.textContent += ' → ' + peerConnection.iceGatheringState);
  if (sessionDescription === undefined) {
    sessionDescription = peerConnection.localDescription;
    // Fire and forget a rotation in an independent flow
    rotate();
  } else {
    // Replace and reuse the existing rotation
    sessionDescription = peerConnection.localDescription;
  }
}

async function rotate() {
  const codeCanvas = document.querySelector('#codeCanvas');
  let codeContext;
  let counter = 0;
  while (sessionDescription !== undefined) {
    // Note that this is updated in any iteration to capture new candidates as they come
    const { sdp, ices } = encode(sessionDescription);
    const count = 1 + ices.length;
    const index = counter % count;
    console.log('stepping', count, index);
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
