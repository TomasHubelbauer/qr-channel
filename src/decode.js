// Decodes SDP + ICE candidates from a QR alphanumeric string
// TODO: Finalize decompressing and unescaping
export default function decode(data) {
  return new RTCSessionDescription({
    type: data.type,
    sdp: [
      'v=0',
      `o=- ${data.id} 0 IN IP4 0.0.0.0`,
      's=-',
      't=0 0',
      `a=fingerprint:sha-256 ${data.hash}`,
      `a=group:BUNDLE 0`,
      'a=ice-options:trickle',
      'a=msid-semantic:WMS',
      `m=application 9 ${data.media === 'firefox' ? 'UDP/DTLS/SCTP webrtc-datachannel' : ''}${data.media === 'chrome' ? 'DTLS/SCTP 5000' : ''}`,
      'c=IN IP4 0.0.0.0',
      `a=ice-ufrag:${data.ufrag}`,
      `a=ice-pwd:${data.pwd}`,
      'a=mid:0',
      `a=setup:${data.type === 'offer' ? 'actpass' : ''}${data.type === 'answer' ? 'active' : ''}`,
      `a=sctp${data.media === 'firefox' ? '-port:5000' : ''}${data.media === 'chrome' ? 'map:5000 webrtc-datachannel 1024' : ''}`,
      '',
    ].join('\r\n'),
  });
}
