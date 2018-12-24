const vLineRegex = /^v=0$/g;
const oLineRegex = /^o=.* (\d+) \d+ IN IP4 \d+.\d+.\d+.\d+$/g;
const sLineRegex = /^s=-$/g;
const tLineRegex = /^t=0 0$/g;
const aFingerprintLineRegex = /^a=fingerprint:sha-256 (([0-9a-fA-F]{2}:){31}[0-9a-fA-F]{2})$/g;
const aGroupLineRegex = /^a=group:BUNDLE (\w+)$/g;
const aIceOptionsLineRegex = /^a=ice-options:trickle$/g;
const aMsidSemanticLineRegex = /^a=msid-semantic:\s?WMS(\s\*)?$/g;
const mLineRegex = /^m=application 9 (UDP\/DTLS\/SCTP webrtc-datachannel|DTLS\/SCTP 5000)$/g;
const cLineRegex = /^c=IN IP4 0\.0\.0\.0$/g;
const aSendRecvLineRegex = /^a=sendrecv$/;
const aIceUfragLineRegex = /^a=ice-ufrag:(.*)$/g;
const aIcePwdLineRegex = /^a=ice-pwd:(.*)$/g;
const aMidLineRegex = /^a=mid:(0|data)$/g;
const aSetupLineRegex = /^a=setup:(actpass|active)$/g;
const aMaxMessageSizeLineRegex = /^a=max-message-size:\d+$/g;
const aSctpPortLineRegex = /^a=sctp-port:5000$/g;
const aSctpMapLineRegex = /^a=sctpmap:5000 webrtc-datachannel 1024$/g;

// Encodes SDP + ICE candidates into a QR alphanumeric string
// TODO: Finalize compressing and escaping
export default function encode(sdp) {
  if (sdp.type !== 'offer' && sdp.type !== 'answer') {
    throw new Error(`Can only handle offer and answer session descriptions`);
  }
  
  const type = sdp.type;
  let id;
  let hash;
  let media;
  let ufrag;
  let pwd;
  let match;
  for (const line of sdp.sdp.split(/\r\n/g)) {
    if ((match = vLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = oLineRegex.exec(line)) !== null) {
      id = match[1];
    } else if ((match = sLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = tLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = aFingerprintLineRegex.exec(line)) !== null) {
      // TODO: Find out if it is safe to assume there's never mixed case
      hash = match[1].replace(/:/g, '');
    } else if ((match = aGroupLineRegex.exec(line)) !== null) {
      // Ignore, we hardcode mid name to dash
    } else if ((match = aIceOptionsLineRegex.exec(line)) !== null) {
       // Ignore, no data
    } else if ((match = aMsidSemanticLineRegex.exec(line)) !== null) {
       // Ignore, browsers set different values (Chrome ` WMS`, Firefox `WMS *`), but `WMS` works for both
    } else if ((match = mLineRegex.exec(line)) !== null) {
      switch (match[1]) {
        case 'UDP/DTLS/SCTP webrtc-datachannel': media = 'firefox'; break;
        case 'DTLS/SCTP 5000': media = 'chrome'; break;
        default: throw new Error(`Unexpected media line value '${match[1]}'.`);
      }
    } else if ((match = cLineRegex.exec(line)) !== null) {
       // Ignore, no data
    } else if ((match = aSendRecvLineRegex.exec(line)) !== null) {
      // Ignore, optional (Firefox only)
    } else if ((match = aIceUfragLineRegex.exec(line)) !== null) {
      ufrag = match[1];
      if (!/^[a-zA-Z0-9]$/g.test(ufrag)) {
        throw new Error('TODO: Implement escaping to QR alphanumeric alphabet');
      }
      
      if (/[A-Z]/g.test(ufrag)) {
        throw new Error('TODO: Implement escaping casing and make casing information a part of the message');
      }
    } else if ((match = aIcePwdLineRegex.exec(line)) !== null) {
      pwd = match[1];
      if (!/^[a-zA-Z0-9]$/g.test(pwd)) {
        throw new Error('TODO: Implement escaping to QR alphanumeric alphabet');
      }
      
      if (/[A-Z]/g.test(pwd)) {
        throw new Error('TODO: Implement escaping casing and make casing information a part of the message');
      }
    } else if ((match = aMidLineRegex.exec(line)) !== null) {
      // Ignore, we hardcode mid name to dash
    } else if ((match = aSetupLineRegex.exec(line)) !== null) {
      // Ignore, deriveable from type
    } else if ((match = aMaxMessageSizeLineRegex.exec(line)) !== null) {
      // Ignore, optional (Firefox only)
    } else if ((match = aSctpPortLineRegex.exec(line)) !== null) {
      // Ignore, deriveable from media
    } else if ((match = aSctpMapLineRegex.exec(line)) !== null) {
      // Ignore, deriveable from media
    } else if (line === '') {
      // Ignore, no data
    } else if (line === 'b=AS:30') {
      // Ignore, random (Chrome only)
    } else {
      throw new Error(`Unexpected SDP line '${line}'.`);
    }
  }
  
  let value = '';
  // Encode three bits of information into one alphanumeric character to save space
  switch (type + '+' media) {
    case 'offer+firefox': value += 'O';
    case 'offer+chrome': value += 'P';
    case 'answer+firefox': value += 'A';
    case 'answer+chrome': value += 'B';
  }
  
  value += ufrag + '.';
  value += pwd + '.';
  // TODO: Compress the ID by translating it from decimal to QR-alphanumeral (base 43 [excluding the period])
  value += id + '.';
  value += hash;
  
  console.log(value, value.length);
  return { type, id, hash, media, ufrag, pwd };
}
