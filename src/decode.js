// Decodes SDP + ICE candidates from a QR alphanumeric string
export default function decode(value) {
  const bitIndices = [value.indexOf('O'), value.indexOf('P'), value.indexOf('A'), value.indexOf('B')].filter(i => i !== -1);
  const bitIndex = Math.min(...bitIndices);
  if (bitIndex === -1) {
    throw new Error('The differentiation character (OPAB) was not found.');
  }
  
  const id = value.substring(0, bitIndex);
  if (!/^\d+$/.test(id)) {
    throw new Error(`The session ID (0-${bitIndex}) is not numeric: '${id}'. SDP: ${value}`);
  }
  
  /** @type {RTCSdpType} */
  let type;
  let media;
  switch (value[bitIndex]) {
    case 'O': type = 'offer'; media = 'firefox'; break;
    case 'P': type = 'offer'; media = 'chrome'; break;
    case 'A': type = 'answer'; media = 'firefox'; break;
    case 'B': type = 'answer'; media = 'chrome'; break;
    default: throw new Error(`Unexpected differentiation character at ${bitIndex}: '${value[bitIndex]}', expected OPAB.`);
  }

  const hashRaw = value.substr(bitIndex + 1, 64);
  let hash = '';
  for (let index = 0; index < hashRaw.length / 2; index++) {
    hash += hashRaw.slice(index * 2, index * 2 + 2) + ':';
  }

  // Remote the trailing colon
  hash = hash.slice(0, -1);
  
  const separatorIndex = value.indexOf(':', bitIndex + 1 /* OPAB bit */ + 64 /* hash */);
  const ufrag = value.substring(bitIndex + 1 /* OPAB bit */ + 64 /* hash */, separatorIndex).toLowerCase().replace(/\/([a-z])/g, m => m[1].toUpperCase()).replace(/\/\//g, '/');
  const pwd = value.substr(separatorIndex + 1 /* colon */).toLowerCase().replace(/\/([a-z])/g, m => m[1].toUpperCase()).replace(/\/\//g, '/');

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
