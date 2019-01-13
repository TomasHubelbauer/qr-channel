import decode from '../decode.js';
import monitor from '../monitor.js';
import melt from '../melt.js';
import encode from '../encode.js';
import scan from './scanMock.js';
import sleep from '../sleep.js';

export default async function coding(onMessage) {
  // Collect the offer SDP and the ICE candidate SDP
  let offer;
  const candidates = [];
  scan(message => {
    // Ignore further messages if we have all we need
    if (offer !== undefined && candidates.length >= 2) {
      return;
    }

    if (message.startsWith('a=')) {
      // Ignore multiple scans of the same candidate
      if (!candidates.includes(message)) {
        candidates.push(message);
      }
    } else {
      offer = decode(message);
    }
  });

  // Idle until we have scanned the offer and the two candidates
  while (offer === undefined || candidates.length < 2 /* TODO: Display end of candidates message and use it to stop this */) {
    await sleep(100);
  }

  // Create test peer connection and start collecting its ICE candidates
  const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
  window.answer = peerConnection;
  monitor(peerConnection, 'test pc', {
    onsignalingstatechange: event => event.currentTarget.signalingState,
    onicegatheringstatechange: event => event.currentTarget.iceGatheringState,
    onconnectionstatechange: event => event.currentTarget.connectionState,
    onicecandidate: event => event.candidate,
  });

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
