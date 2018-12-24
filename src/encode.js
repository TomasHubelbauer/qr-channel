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
export default function encode(sdp) {
  if (sdp.type !== 'offer' && sdp.type !== 'answer') {
    throw new Error(`Can only handle offer and answer session descriptions, not ${sdp.type}.`);
  }
  
  const type = sdp.type;
  let id;
  let hash;
  let media;
  let ufrag;
  let pwd;
  let ices = [];
  let match;
  for (const line of sdp.sdp.split(/\r\n/g)) {
    if ((match = line.match(vLineRegex)) !== null) {
      // Ignore, no data
    } else if ((match = line.match(oLineRegex)) !== null) {
      id = match[1];
      if (id.length !== 19 && id.length !== 18) {
        throw new Error(`TODO: Implement a mechanism for handling IDs that are not 18-19 digits long: ${id} (${id.length})`);
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
      if (!/^[a-zA-Z0-9\+-\/]+$/g.test(ufrag)) {
        throw new Error('TODO: Implement escaping to QR alphanumeric alphabet: ' + ufrag);
      }
      
      ufrag = ufrag.replace(/\//g, '//').replace(/[A-Z]/g, m => '/' + m[0]).toUpperCase();
    } else if ((match = line.match(aIcePwdLineRegex)) !== null) {
      pwd = match[1];
      if (!/^[a-zA-Z0-9\+-\/]+$/g.test(pwd)) {
        throw new Error('TODO: Implement escaping to QR alphanumeric alphabet ' + pwd);
      }
      
      pwd = pwd.replace(/\//g, '//').replace(/[A-Z]/g, m => '/' + m[0]).toUpperCase();
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
      ices.push(match[0]);
    } else if (line === 'a=end-of-candidates') {
      // Ignore, no data
    } else {
      throw new Error(`Unexpected SDP line '${line}'.`);
    }
  }
  
  let value = '';
  // Encode multiple bits of information into one alphanumeric character to save space
  switch (type + '+' + media + '+' + id.length) {
    case 'offer+firefox+19': value += 'O'; break;
    case 'offer+chrome+19': value += 'P'; break;
    case 'offer+firefox+18': value += 'Q'; break;
    case 'offer+chrome+18': value += 'R'; break;
    case 'answer+firefox+19': value += 'A'; break;
    case 'answer+chrome+19': value += 'B'; break;
    case 'answer+firefox+18': value += 'C'; break;
    case 'answer+chrome+18': value += 'D'; break;
  }
  
  // TODO: Rebase the ID from decimal to QR-alphanumeral (base 43 excluding the colon) if it beats a fixed 18-19 digit slice
  value += hash + id + ufrag + ':' + pwd;
  return { sdp: value, ices };
}
