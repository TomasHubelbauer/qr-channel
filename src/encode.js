const vLineRegex = /^v=0$/;
const oLineRegex = /^o=.* (\d+) \d+ IN IP4 \d+.\d+.\d+.\d+$/;
const sLineRegex = /^s=-$/;
const tLineRegex = /^t=0 0$/;
const aFingerprintLineRegex = /^a=fingerprint:sha-256 (([0-9a-fA-F]{2}:){31}[0-9a-fA-F]{2})$/;
const aGroupLineRegex = /^a=group:BUNDLE (\w+)$/;
const aIceOptionsLineRegex = /^a=ice-options:trickle$/;
const aMsidSemanticLineRegex = /^a=msid-semantic:\s?WMS(\s\*)?$/;
// TODO: Find out if this number here (\d+) needs to be preserved or not
const mLineRegex = /^m=application \d+ (UDP\/DTLS\/SCTP webrtc-datachannel|DTLS\/SCTP 5000)$/;
// TODO: Find out if this IP address (which is 0.0.0.0 pre-ICE and has a value post-ICE) needs to be preserved
const cLineRegex = /^c=IN IP4 \d+\.\d+\.\d+\.\d+$/;
const aSendRecvLineRegex = /^a=sendrecv$/;
const aIceUfragLineRegex = /^a=ice-ufrag:(.*)$/;
const aIcePwdLineRegex = /^a=ice-pwd:(.*)$/;
const aMidLineRegex = /^a=mid:(0|data)$/;
const aSetupLineRegex = /^a=setup:(actpass|active)$/;
const aMaxMessageSizeLineRegex = /^a=max-message-size:\d+$/;
const aSctpPortLineRegex = /^a=sctp-port:5000$/;
const aSctpMapLineRegex = /^a=sctpmap:5000 webrtc-datachannel 1024$/;
const aCandidateLineRegex = /^a=candidate:.*$/;

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
    if ((match = line.match(vLineRegex)) !== null) {
      // Ignore, no data
    } else if ((match = line.match(oLineRegex)) !== null) {
      id = match[1];
      if (id.length !== 19) {
        throw new Error(`TODO: Implement a mechanism for handling IDs that are not 19 digits long: ${id} (${id.length})`);
      }
    } else if ((match = line.match(sLineRegex)) !== null) {
      // Ignore, no data
    } else if ((match = line.match(tLineRegex)) !== null) {
      // Ignore, no data
    } else if ((match = line.match(aFingerprintLineRegex)) !== null) {
      // TODO: Find out if it is safe to assume there's never mixed case
      hash = match[1].replace(/:/g, '');
    } else if ((match = line.match(aGroupLineRegex)) !== null) {
      // Ignore, we hardcode mid name to dash
    } else if ((match = line.match(aIceOptionsLineRegex)) !== null) {
       // Ignore, no data
    } else if ((match = line.match(aMsidSemanticLineRegex)) !== null) {
       // Ignore, browsers set different values (Chrome ` WMS`, Firefox `WMS *`), but `WMS` works for both
    } else if ((match = line.match(mLineRegex)) !== null) {
      switch (match[1]) {
        case 'UDP/DTLS/SCTP webrtc-datachannel': media = 'firefox'; break;
        case 'DTLS/SCTP 5000': media = 'chrome'; break;
        default: throw new Error(`Unexpected media line value '${match[1]}'.`);
      }
    } else if ((match = line.match(cLineRegex)) !== null) {
       // Ignore, no data
    } else if ((match = line.match(aSendRecvLineRegex)) !== null) {
      // Ignore, optional (Firefox only)
    } else if ((match = line.match(aIceUfragLineRegex)) !== null) {
      ufrag = match[1];
      if (!/^[a-zA-Z0-9]+$/g.test(ufrag)) {
        throw new Error('TODO: Implement escaping to QR alphanumeric alphabet: ' + ufrag);
      }
      
      if (/[A-Z]/g.test(ufrag)) {
        if (ufrag.includes('/')) {
          throw new Error('TODO: Implement escaping casing even for values containing slashes: ' + ufrag);
        }
            
        ufrag = ufrag.replace(/[A-Z]/g, m => '/' + m[0]);
      }
      
      ufrag = ufrag.toUpperCase();
    } else if ((match = line.match(aIcePwdLineRegex)) !== null) {
      pwd = match[1];
      if (!/^[a-zA-Z0-9]+$/g.test(pwd)) {
        throw new Error('TODO: Implement escaping to QR alphanumeric alphabet ' + pwd);
      }
      
      if (/[A-Z]/g.test(pwd)) {
        if (pwd.includes('/')) {
          throw new Error('TODO: Implement escaping casing even for values containing slashes: ' + pwd);
        }
            
        pwd = pwd.replace(/[A-Z]/g, m => '/' + m[0]);
      }
      
      pwd = pwd.toUpperCase();
    } else if ((match = line.match(aMidLineRegex)) !== null) {
      // Ignore, we hardcode mid name to dash
    } else if ((match = line.match(aSetupLineRegex)) !== null) {
      // Ignore, deriveable from type
    } else if ((match = line.match(aMaxMessageSizeLineRegex)) !== null) {
      // Ignore, optional (Firefox only)
    } else if ((match = line.match(aSctpPortLineRegex)) !== null) {
      // Ignore, deriveable from media
    } else if ((match = line.match(aSctpMapLineRegex)) !== null) {
      // Ignore, deriveable from media
    } else if (line === '') {
      // Ignore, no data
    } else if (line === 'b=AS:30') {
      // Ignore, random (Chrome only)
    } else if ((match = line.match(aCandidateLineRegex)) !== null) {
      // Ignore, we handle ICE candidates separately
    } else {
      throw new Error(`Unexpected SDP line '${line}'.`);
    }
  }
  
  let value = '';
  // Encode three bits of information into one alphanumeric character to save space
  switch (type + '+' + media) {
    case 'offer+firefox': value += 'O'; break;
    case 'offer+chrome': value += 'P'; break;
    case 'answer+firefox': value += 'A'; break;
    case 'answer+chrome': value += 'B'; break;
  }
  
  // TODO: Rebase the ID from decimal to QR-alphanumeral (base 43 excluding the colon) if it beats a fixed 19-digit slice
  value += hash + id + ufrag + ':' + pwd;
  return value;
}
