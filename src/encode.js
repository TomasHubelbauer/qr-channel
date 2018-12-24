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
  
  const data = { type: sdp.type };
  let match;
  for (const line of sdp.sdp.split(/\r\n/g)) {
    if ((match = vLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = oLineRegex.exec(line)) !== null) {
      data.id = match[1];
    } else if ((match = sLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = tLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = aFingerprintLineRegex.exec(line)) !== null) {
      // TODO: Remove the colons and figure out how to handle case (escaping)
      data.hash = match[1];
    } else if ((match = aGroupLineRegex.exec(line)) !== null) {
      // Ignore, we hardcode mid name to dash
    } else if ((match = aIceOptionsLineRegex.exec(line)) !== null) {
       // Ignore, no data
    } else if ((match = aMsidSemanticLineRegex.exec(line)) !== null) {
       // Ignore, browsers set different values (Chrome ` WMS`, Firefox `WMS *`), but `WMS` works for both
    } else if ((match = mLineRegex.exec(line)) !== null) {
      switch (match[1]) {
        case 'UDP/DTLS/SCTP webrtc-datachannel': data.media = 'firefox'; break;
        case 'DTLS/SCTP 5000': data.media = 'chrome'; break;
        default: throw new Error(`Unexpected media line value '${match[1]}'.`);
      }
    } else if ((match = cLineRegex.exec(line)) !== null) {
       // Ignore, no data
    } else if ((match = aSendRecvLineRegex.exec(line)) !== null) {
      // Ignore, optional (Firefox only)
    } else if ((match = aIceUfragLineRegex.exec(line)) !== null) {
      data.ufrag = match[1];
    } else if ((match = aIcePwdLineRegex.exec(line)) !== null) {
      // TODO: See if knowing that for Firefox this is a serialized GUID we could make assumptions about case and save escaping
      data.pwd = match[1];
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
  
  return data;
}
