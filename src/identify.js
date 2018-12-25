export default function identify(sessionDescription) {
  return sessionDescription.sdp
    .split(/\r\n/g)
    .map(l => l.match(/^o=.* (\d+) \d+ IN IP4 \d+.\d+.\d+.\d+$/))
    .filter(m => m !== null)
    [0][1];
}
