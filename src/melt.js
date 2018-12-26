export default function melt(ice, sdp) {
  const [sdp, id] = message.split('\n');
  
  if (!sdp.sdp.split(/\r\n/g).includes(sdp)) {
    return new RTCIceCandidate({ candidate: sdp, sdpMid: "0", sdpMLineIndex: 0 });
  }
}
