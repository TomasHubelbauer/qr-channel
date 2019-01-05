import decode from '../decode.js';
import monitor from '../monitor.js';
import melt from '../melt.js';
import encode from '../encode.js';

export default async function coding(onMessage) {
  // Get the offer code
  /** @type {HTMLCanvasElement|null} */
  const codeCanvas = document.querySelector('#codeCanvas');
  if (codeCanvas === null) {
    throw new Error('The #codeCanvas element was not found.');
  }

  // Collect the offer SDP and the ICE candidate SDP
  let offer;
  const candidates = [];
  while (offer === undefined || candidates.length < 2 /* TODO: Display end of candidates message and use it to stop this */) {
    const code = codeCanvas.title;
    if (code === '') {
        // Wait until the offering codes start showing
    } else if (code.startsWith('a=')) {
        // Ignore multiple scans of the same candidate
        if (!candidates.includes(code)) {
            candidates.push(code);
        }
    } else {
        offer = decode(code);
    }

    await new Promise(resolve => window.setTimeout(resolve, 100));
  }

  // Create test peer connection and start collecting its ICE candidates
  const peerConnection = new RTCPeerConnection();
  monitor(peerConnection, 'test pc');
  peerConnection.addEventListener('signalingstatechange', _ => console.log('test pc signaling state ' + peerConnection.signalingState));
  peerConnection.addEventListener('icegatheringstatechange', _ => console.log('test pc ICE gathering state ' + peerConnection.iceGatheringState));
  peerConnection.addEventListener('connectionstatechange', _ => console.log('test pc connection state ' + peerConnection.connectionState));

  const seen = [];
  peerConnection.addEventListener('icecandidate', event => {
    console.log('test PC ICE candidate ' + (event.candidate ? event.candidate.candidate : 'null'))
    if (event.candidate !== null) {
      const ices = encode(peerConnection.localDescription).ices;
      for (const ice of ices.filter(i => !seen.includes(i))) {
        seen.push(ice);
        onMessage(ice);
      }
    }
  });

  // Set the offer and the candidates to the peer connection
  await peerConnection.setRemoteDescription(offer);
  for (const candidate of candidates) {
    const melted = melt(candidate, peerConnection.remoteDescription);
    if (melted === undefined) {
        throw new Error('Unexpected duplicate candidate');
    }

    await peerConnection.addIceCandidate(melted.sdp);
  }

  // Create an answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  onMessage(encode(answer).sdp);
}
