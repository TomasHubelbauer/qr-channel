export default function identify(sessionDescription) {
  const sessionId = sessionDescription.sdp
    .split(/\r\n/g)
    .map(l => l.match(/^o=.* (\d+) \d+ IN IP4 \d+.\d+.\d+.\d+$/))
    .filter(m => m !== null)
    [0][1];
  
  return `${sessionDescription.type} ${sessionId}`;
}
