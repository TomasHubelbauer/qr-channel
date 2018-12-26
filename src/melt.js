export default function melt(ice, sessionDescription) {
  const [sdp, id] = ice.split('\n');
  
  if (!sessionDescription.sdp.split(/\r\n/g).includes(sdp)) {
    return { sdp: new RTCIceCandidate({ candidate: sdp, sdpMid: "0", sdpMLineIndex: 0 }), id };
  }
}
