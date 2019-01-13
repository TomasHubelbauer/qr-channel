import monitor from '../monitor.js';
import encode from '../encode.js';
import decode from '../decode.js';
import melt from '../melt.js';
import sleep from '../sleep.js';
import scan from './scanMock.js';

export default async function coding() {
  try {
    // Obtain a dummy media stream first so that iOS Safari reveals host candidates (permissions need to be granted for that)
    if (navigator.vendor === 'Apple Computer, Inc.') {
      await navigator.mediaDevices.getUserMedia({ video: true });
    }

    const peerConnection1 = new RTCPeerConnection();
    monitor(peerConnection1, '1', {
      onsignalingstatechange: event => event.currentTarget.signalingState,
      onicegatheringstatechange: event => event.currentTarget.iceGatheringState,
      onconnectionstatechange: event => event.currentTarget.connectionState,
      onicecandidate: event => event.candidate,
    });

    const dataChannel = peerConnection1.createDataChannel('');
    monitor(dataChannel, 'dc 1');

    const offerData = encode(await peerConnection1.createOffer()).sdp;
    const offerCode = qrcode(0, 'L');
    offerCode.addData(offerData, 'Alphanumeric');
    offerCode.make();
    console.log(`${offerData} (${offerData.length}, ${offerCode.getModuleCount()})`);
    console.log(offerCode.createASCII());
    const offer = decode(offerData);

    await peerConnection1.setLocalDescription(offer);

    // Collect the offer SDP and the ICE candidate SDP
    let candidates = [];
    scan(message => {
      // Ignore further messages if we have all we need
      if (candidates.length >= 2) {
        return;
      }

      if (message.startsWith('a=')) {
        // Ignore multiple scans of the same candidate
        if (!candidates.includes(message)) {
          candidates.push(message);
        }
      }
    }, () => peerConnection1.localDescription.sdp.split('\n').filter(line => line.startsWith('a=candidate:'));)

    while (candidates.length < 2 /* TODO: Display end of candidates message and use it to stop this */) {
      await sleep(100);
    }

    console.log('handing over');

    const peerConnection2 = new RTCPeerConnection();
    monitor(peerConnection2, '2', {
      onsignalingstatechange: event => event.currentTarget.signalingState,
      onicegatheringstatechange: event => event.currentTarget.iceGatheringState,
      onconnectionstatechange: event => event.currentTarget.connectionState,
      onicecandidate: event => event.candidate,
    });

    await peerConnection2.setRemoteDescription(offer);

    // Set the offer and the candidates to the peer connection
    for (const candidate of candidates) {
      const melted = melt(candidate, peerConnection2.remoteDescription);
      if (melted === undefined) {
          throw new Error('Unexpected duplicate candidate');
      }

      await peerConnection2.addIceCandidate(melted.sdp);
    }

    const answerData = encode(await peerConnection2.createAnswer()).sdp;
    const answerCode = qrcode(0, 'L');
    answerCode.addData(answerData, 'Alphanumeric');
    answerCode.make();
    console.log(`${answerData} (${answerData.length}, ${answerCode.getModuleCount()})`);
    console.log(answerCode.createASCII());
    const answer = decode(answerData);

    await peerConnection2.setLocalDescription(answer);
    await peerConnection1.setRemoteDescription(answer);

    const seen2 = [];
    peerConnection2.addEventListener('icecandidate', event => {
      if (event.candidate !== null) {
        const ices = encode(peerConnection2.localDescription).ices;
        for (const ice of ices.filter(i => !seen2.includes(i))) {
          seen2.push(ice);
          const candidate = melt(ice, peerConnection1.localDescription);
          if (candidate !== undefined) {
            // Ignore same duplicate being seen twice or already being in the other connection from its gathering
            peerConnection1.addIceCandidate(candidate.sdp);
          }
        }
      }
    });

    dataChannel.addEventListener('open', () => {
      dataChannel.send('message from 1 to 2');
    });

    dataChannel.addEventListener('message', event => {
      console.log('2: ' + event.data);
    });

    peerConnection2.addEventListener('datachannel', event => {
      monitor(event.channel, 'dc 2');
      event.channel.addEventListener('open', () => {
        event.channel.send('message from 2 to 1');
      });

      event.channel.addEventListener('message', event => {
        console.log('1: ' + event.data);
      });
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
