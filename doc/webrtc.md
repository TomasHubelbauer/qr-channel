# WebRTC

> Some notes on WebRTC

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