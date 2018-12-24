// Decodes SDP + ICE candidates from a QR alphanumeric string
// TODO: Finalize decompressing and unescaping
export default function decode(value) {
  let type;
  let media;
  switch (value[0]) {
    case 'O': type = 'offer'; media = 'firefox'; break;
    case 'P': type = 'offer'; media = 'chrome'; break;
    case 'A': type = 'answer'; media = 'firefox'; break;
    case 'B': type = 'answer'; media = 'chrome'; break;
  }
  
  // TODO: Read a new bit which says whether the ICE candidates are lowercased or mixedcased
  const hashRaw = value.slice(1, 1 + 64); // TODO: Insert the colons
  let hash = '';
  for (let index = 0; index < hashRaw.length / 2; index++) {
    hash += hashRaw.slice(index * 2, index * 2 + 2) + ':';
  }

  hash = hash.slice(0, -1);
  const id = value.slice(1 + 64, 1 + 64 + 19);
  const ufrag = value.slice(1 + 64 + 19, value.indexOf(':')).toLowerCase().replace(/\/([a-z])/g, m => m[1].toUpperCase());
  const pwd = value.slice(value.indexOf(':') + ':'.length).toLowerCase().replace(/\/([a-z])/g, m => m[1].toUpperCase());
  
  return new RTCSessionDescription({
    type: type,
    sdp: [
      'v=0',
      `o=- ${id} 0 IN IP4 0.0.0.0`,
      's=-',
      't=0 0',
      `a=fingerprint:sha-256 ${hash}`,
      `a=group:BUNDLE 0`,
      'a=ice-options:trickle',
      'a=msid-semantic:WMS',
      `m=application 9 ${media === 'firefox' ? 'UDP/DTLS/SCTP webrtc-datachannel' : ''}${media === 'chrome' ? 'DTLS/SCTP 5000' : ''}`,
      'c=IN IP4 0.0.0.0',
      `a=ice-ufrag:${ufrag}`,
      `a=ice-pwd:${pwd}`,
      'a=mid:0',
      `a=setup:${type === 'offer' ? 'actpass' : ''}${type === 'answer' ? 'active' : ''}`,
      `a=sctp${media === 'firefox' ? '-port:5000' : ''}${media === 'chrome' ? 'map:5000 webrtc-datachannel 1024' : ''}`,
      '',
    ].join('\r\n'),
  });
}
