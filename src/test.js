import monitor from './monitor.js';
import log from './log.js';
import encode from './encode.js';
import decode from './decode.js';

export default async function test() {
  const peerConnection1 = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
  monitor(peerConnection1, '1');
  peerConnection1.addEventListener('signalingstatechange', _ => log('1 signaling state ' + peerConnection1.signalingState));
  peerConnection1.addEventListener('icegatheringstatechange', _ => log('1 ICE gathering state ' + peerConnection1.iceGatheringState));
  peerConnection1.addEventListener('connectionstatechange', _ => log('1 connection state ' + peerConnection1.connectionState));
  
  const peerConnection2 = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
  monitor(peerConnection2, '2');
  peerConnection2.addEventListener('signalingstatechange', _ => log('2 signaling state ' + peerConnection1.signalingState));
  peerConnection2.addEventListener('icegatheringstatechange', _ => log('2 ICE gathering state ' + peerConnection1.iceGatheringState));
  peerConnection2.addEventListener('connectionstatechange', _ => log('2 connection state ' + peerConnection1.connectionState));
  
  const dataChannel = peerConnection1.createDataChannel(null);
  monitor(dataChannel, 'dc 1');
  
  const offerData = encode(await peerConnection1.createOffer());
  const offerCode = qrcode(0, 'L');
  offerCode.addData(JSON.stringify(offerData), 'Byte');
  offerCode.make();
  console.log(offerCode.createDataURL(10, 10));
  const offer = decode(offerData);
  
  await peerConnection1.setLocalDescription(offer);
  await peerConnection2.setRemoteDescription(offer);
  
  const answerData = encode(await peerConnection2.createAnswer());
  const answerCode = qrcode(0, 'L');
  answerCode.addData(JSON.stringify(answerData), 'Byte');
  answerCode.make();
  console.log(answerCode.createDataURL(10, 10));
  const answer = decode(answerData);
  
  await peerConnection2.setLocalDescription(answer);
  await peerConnection1.setRemoteDescription(answer);
  
  peerConnection1.addEventListener('icecandidate', event => {
    log('1 ICE candidate ' + (event.candidate ? event.candidate.candidate : 'null'))
    if (event.candidate !== null) {
      peerConnection2.addIceCandidate(event.candidate);
    }
  });
  
  peerConnection2.addEventListener('icecandidate', event => {
    log('2 ICE candidate ' + (event.candidate ? event.candidate.candidate : 'null'))
    if (event.candidate !== null) {
      peerConnection1.addIceCandidate(event.candidate);
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
}
