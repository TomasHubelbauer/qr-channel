import encode from './encode.js';
import sleep from './sleep.js';

let peerConnection;
export default function broadcast(connection) {
  // Stop the existing rotation by clearing the session description
  if (connection === undefined) {
    peerConnection = undefined;

    /** @type {HTMLCanvasElement|null} */
    const codeCanvas = document.querySelector('#codeCanvas');
    if (codeCanvas === null) {
      throw new Error('The #codeCanvas element was not found.');
    }

    const context = codeCanvas.getContext('2d');
    if (context === null) {
      throw new Error('Failed to obtain canvas context');
    }

    context.clearRect(0, 0, codeCanvas.width, codeCanvas.height);
    return;
  }
  
  const typeP = document.querySelector('#typeP');
  if (typeP === null) {
    throw new Error('The #typeP element was not found.');
  }
  
  const signalingStateP = document.querySelector('#signalingStateP');
  if (signalingStateP === null) {
    throw new Error('The #signalingStateP element was not found.');
  }
  
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');
  if (iceGatheringStateP === null) {
    throw new Error('The #iceGatheringStateP element was not found.');
  }

  const iceConnectionStateP = document.querySelector('#iceConnectionStateP');
  if (iceConnectionStateP === null) {
    throw new Error('The #iceConnectionStateP element was not found.');
  }
  
  if (peerConnection === undefined) {
    peerConnection = connection;
    // Fire and forget the rotation in an independent flow
    rotate();
  } else {
    // Replace and reuse the existing rotation
    peerConnection = connection;
  }
  
  typeP.textContent += ' → ' + peerConnection.localDescription.type;
  peerConnection.addEventListener('signalingstatechange', event => signalingStateP.textContent += ' → ' + event.currentTarget.signalingState);
  peerConnection.addEventListener('icegatheringstatechange', event => iceGatheringStateP.textContent += ' → ' + event.currentTarget.iceGatheringState);
  peerConnection.addEventListener('iceconnectionstatechange', event => iceConnectionStateP.textContent += ' → ' + event.currentTarget.iceConnectionState);
}

async function rotate() {
  /** @type {HTMLCanvasElement|null} */
  const codeCanvas = document.querySelector('#codeCanvas');
  if (codeCanvas === null) {
    throw new Error('The #codeCanvas element was not found.');
  }
  
  let codeContext;
  let counter = 0;
  while (peerConnection !== undefined) {
    // Note that this is updated in any iteration to capture new candidates as they come
    const { sdp, ices } = encode(peerConnection.localDescription); // Use local description always (offer or answer)
    const count = 1 + ices.length;
    const index = counter % count;
    const qr = qrcode(0, 'L');
    if (index === 0) {
      qr.addData(sdp, 'Alphanumeric');
      codeCanvas.title = sdp;
    } else {
      qr.addData(ices[index - 1], 'Byte');
      codeCanvas.title = ices[index - 1];
    }
    
    const { width, height } = codeCanvas.getBoundingClientRect();
    if (codeCanvas.width !== width || codeCanvas.height !== height) {
      codeCanvas.width = width;
      codeCanvas.height = height;
      codeContext = codeCanvas.getContext('2d');
      if (codeContext === null) {
        throw new Error('Failed to obtain canvas context');
      }
    } else if (codeContext === undefined) {
      throw new Error('Context was not set');
    } else {
      codeContext.clearRect(0, 0, codeCanvas.width, codeCanvas.height);
    }

    qr.make();
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
    await sleep(250);
  }
}
