# WebRTC

> Some notes on WebRTC

## Learning Resources

- [Anatomy of a WebRTC SDP](https://webrtchacks.com/sdp-anatomy/)
- [The Minimum Viable SDP](https://webrtchacks.com/the-minimum-viable-sdp/) (with respect to the QR alphanumeric alphabet)

## Flow

- Peer A creates a peer connection with a data channel
- Peer A creates an offer and sets it as its local description
- Peer A displays the offer SDP and its ICE candidate SDPs

---

- Peer B notices the offer SDP
- Peer B creates a peer connection without a data channel
- Peer B sets the noticed offer as its remote description
- Peer B creates an answer and sets it to its local description
- Peer B displays the answer SDP and its ICE candidate SDPs

---

- Peer B notices peer A candidate SDP and adds the ICE candidate

---

- Peer A notices the answer SDP
- Peer A sets the noticed answer as its remote description

---

- Peer A notices peer B candidate SDP and adds the ICE candidate

---

- At some point the data channel opens for both

## Browser Specific Findings

- Firefox sets the session ID in the `o` line, but it can be changed to dash at no harm to functionality
- The `a=mid` line name can be hardcoded to any value as long as it matched the value in the `a=group` line
- Chrome sometimes emits a `b` line message which is safe to ignore, didn't track it down much, pretty random
- Safari requires `navigator.mediaDevices.getUserMedia` permission to be given before it provides the host candidates, see:
  [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=189503)
- `RTCPeerConnection`, upon gathering an ICE candidate, will replace (not update) the `localDescription` object
  (so any references to the old session description will always contain SDP without the ICE candidate lines)

## Example SDP

- [ ] Add Safari SDP here
- [ ] See what's up with Edge and ORTC/WebRTC

Chrome:

```ini
v=0
o=- 0000000000000000000 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE data
a=msid-semantic: WMS
m=application 9 DTLS/SCTP 5000
c=IN IP4 0.0.0.0
a=ice-ufrag:????
a=ice-pwd:????????????????????????
a=ice-options:trickle
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
a=setup:actpass
a=mid:data
a=sctpmap:5000 webrtc-datachannel 1024
```

Firefox:

```ini
v=0
o=mozilla...THIS_IS_SDPARTA-64.0 0000000000000000000 0 IN IP4 0.0.0.0
s=-
t=0 0
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
a=group:BUNDLE 0
a=ice-options:trickle
a=msid-semantic:WMS *
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=sendrecv
a=ice-pwd:????????????????????????????????
a=ice-ufrag:????????
a=mid:0
a=setup:actpass
a=sctp-port:5000
a=max-message-size:1073741823
```
