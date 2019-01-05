import monitor from '../monitor.js';
import encode from '../encode.js';
import decode from '../decode.js';
import melt from '../melt.js';

export default async function coding() {
  try {
    // Obtain a dummy media stream first so that iOS Safari reveals host candidates (permissions need to be granted for that)
    await navigator.mediaDevices.getUserMedia({ video: true });

    const peerConnection1 = new RTCPeerConnection();
    monitor(peerConnection1, '1');
    peerConnection1.addEventListener('signalingstatechange', _ => console.log('1 signaling state ' + peerConnection1.signalingState));
    peerConnection1.addEventListener('icegatheringstatechange', _ => console.log('1 ICE gathering state ' + peerConnection1.iceGatheringState));
    peerConnection1.addEventListener('connectionstatechange', _ => console.log('1 connection state ' + peerConnection1.connectionState));

    const peerConnection2 = new RTCPeerConnection();
    monitor(peerConnection2, '2');
    peerConnection2.addEventListener('signalingstatechange', _ => console.log('2 signaling state ' + peerConnection1.signalingState));
    peerConnection2.addEventListener('icegatheringstatechange', _ => console.log('2 ICE gathering state ' + peerConnection1.iceGatheringState));
    peerConnection2.addEventListener('connectionstatechange', _ => console.log('2 connection state ' + peerConnection1.connectionState));

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
    await peerConnection2.setRemoteDescription(offer);

    const answerData = encode(await peerConnection2.createAnswer()).sdp;
    const answerCode = qrcode(0, 'L');
    answerCode.addData(answerData, 'Alphanumeric');
    answerCode.make();
    console.log(`${answerData} (${answerData.length}, ${answerCode.getModuleCount()})`);
    console.log(answerCode.createASCII());
    const answer = decode(answerData);

    await peerConnection2.setLocalDescription(answer);
    await peerConnection1.setRemoteDescription(answer);

    const seen1 = [];
    peerConnection1.addEventListener('icecandidate', event => {
      console.log('1 ICE candidate ' + (event.candidate ? event.candidate.candidate : 'null'))
      if (event.candidate !== null) {
        const ices = encode(peerConnection1.localDescription).ices;
        for (const ice of ices.filter(i => !seen1.includes(i))) {
          seen1.push(ice);
          const candidate = melt(ice, peerConnection2.localDescription);
          if (candidate === undefined) {
            throw new Error('Duplicate candidate found!');
          }
          
          peerConnection2.addIceCandidate(candidate.sdp);
        }
      }
    });

    const seen2 = [];
    peerConnection2.addEventListener('icecandidate', event => {
      console.log('2 ICE candidate ' + (event.candidate ? event.candidate.candidate : 'null'))
      if (event.candidate !== null) {
        const ices = encode(peerConnection2.localDescription).ices;
        for (const ice of ices.filter(i => !seen2.includes(i))) {
          seen2.push(ice);
          const candidate = melt(ice, peerConnection1.localDescription);
          if (candidate === undefined) {
            throw new Error('Duplicate candidate found!');
          }
          
          peerConnection1.addIceCandidate(candidate.sdp);
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
