# WebRTC

> Some notes on WebRTC

## Learning Resources

- [Anatomy of a WebRTC SDP](https://webrtchacks.com/sdp-anatomy/)
- [The Minimum Viable SDP](https://webrtchacks.com/the-minimum-viable-sdp/) (with respect to the QR alphanumeric alphabet)

## Browser Specific Findings

- Firefox sets the session ID in the `o` line, but it can be changed to dash at no harm to functionality
- The `a=mid` line name can be hardcoded to any value as long as it matched the value in the `a=group` line
- Chrome sometimes emits a `b` line message which is safe to ignore, didn't track it down much, pretty random
- Safari requires `navigator.mediaDevices.getUserMedia` permission to be given before it provides the host candidates, see:
  [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=189503)

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
