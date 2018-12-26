import monitor from '../monitor.js';
import log from '../log.js';
import encode from '../encode.js';
import decode from '../decode.js';
import melt from '../melt.js';

export default async function coding() {
  try {
    // Obtain a dummy media stream first so that iOS Safari reveals host candidates (permissions need to be granted for that)
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });

    const peerConnection1 = new RTCPeerConnection();
    monitor(peerConnection1, '1');
    peerConnection1.addEventListener('signalingstatechange', _ => log('1 signaling state ' + peerConnection1.signalingState));
    peerConnection1.addEventListener('icegatheringstatechange', _ => log('1 ICE gathering state ' + peerConnection1.iceGatheringState));
    peerConnection1.addEventListener('connectionstatechange', _ => log('1 connection state ' + peerConnection1.connectionState));

    const peerConnection2 = new RTCPeerConnection();
    monitor(peerConnection2, '2');
    peerConnection2.addEventListener('signalingstatechange', _ => log('2 signaling state ' + peerConnection1.signalingState));
    peerConnection2.addEventListener('icegatheringstatechange', _ => log('2 ICE gathering state ' + peerConnection1.iceGatheringState));
    peerConnection2.addEventListener('connectionstatechange', _ => log('2 connection state ' + peerConnection1.connectionState));

    const dataChannel = peerConnection1.createDataChannel('');
    monitor(dataChannel, 'dc 1');

    const offerData = encode(await peerConnection1.createOffer()).sdp;
    const offerCode = qrcode(0, 'L');
    offerCode.addData(offerData, 'Alphanumeric');
    offerCode.make();
    log(`${offerData} (${offerData.length}, ${offerCode.getModuleCount()})`);
    log(offerCode.createASCII());
    const offer = decode(offerData);

    await peerConnection1.setLocalDescription(offer);
    await peerConnection2.setRemoteDescription(offer);

    const answerData = encode(await peerConnection2.createAnswer()).sdp;
    const answerCode = qrcode(0, 'L');
    answerCode.addData(answerData, 'Alphanumeric');
    answerCode.make();
    log(`${answerData} (${answerData.length}, ${answerCode.getModuleCount()})`);
    log(answerCode.createASCII());
    const answer = decode(answerData);

    await peerConnection2.setLocalDescription(answer);
    await peerConnection1.setRemoteDescription(answer);

    peerConnection1.addEventListener('icecandidate', event => {
      log('1 ICE candidate ' + (event.candidate ? event.candidate.candidate : 'null'))
      if (event.candidate !== null) {
        const ices = encode(peerConnection1.localDescription).ices;
        const ice = ices[ices.length - 1];
        const { sdp, id } = melt(ice, peerConnection2.localDescription);
        peerConnection2.addIceCandidate(sdp);
      }
    });

    peerConnection2.addEventListener('icecandidate', event => {
      log('2 ICE candidate ' + (event.candidate ? event.candidate.candidate : 'null'))
      if (event.candidate !== null) {
        const ices = encode(peerConnection2.localDescription).ices;
        const ice = ices[ices.length - 1];
        const { sdp, id } = melt(ice, peerConnection1.localDescription);
        peerConnection1.addIceCandidate(sdp);
      }
    });

    dataChannel.addEventListener('open', () => {
      dataChannel.send('message from 1 to 2');
    });

    dataChannel.addEventListener('message', event => {
      log('2: ' + event.data);
    });

    peerConnection2.addEventListener('datachannel', event => {
      monitor(event.channel, 'dc 2');
      event.channel.addEventListener('open', () => {
        event.channel.send('message from 2 to 1');
      });

      event.channel.addEventListener('message', event => {
        log('1: ' + event.data);
      });
    });
  } catch (error) {
    log(error);
    throw error;
  }
}
