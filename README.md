# [QR Channel](https://tomashubelbauer.github.io/qr-channel/)

This is an experiment in establishing WebRTC peer connection with a data channel between two devices equipped with web cams by
exchanging QR codes with offer/answer SDP data and ICE candidate data.

## Running

[Demo](https://tomashubelbauer.github.io/qr-channel/)

## Debugging

- Clear iOS Safari website cache: Settings > Safari > Advanced > Website Data > `tomashubelbauer.github.io` > swipe to clear

## Contributing

GitHub issues are closed, use a pull request to start discussion about a patch or email me at tomas@hubelbauer.net.

### Roadmap

Also see the `TODO` comments in the source code and MarkDown checkboxen in the other MarkDown files.

- [ ] Finalize SDP encoding/decoding, particularly using string over JSON escaping and unescaping to QR alphanumeric alphabet
- [ ] Find out if the Chrome camera stream dimensions 2x2 are a problem with my laptop only by testing on a different machine
- [ ] Await help with [WebRTC peer connection does not establish on Safari, does in Chrome, Firefox](
      https://stackoverflow.com/q/53913449/2715716)
- [ ] Work on ICE candidate encoding/decoding similar to the SDP pipeline
- [ ] Consider flashing SDP and ICE candidates and individual messages if the sizes work out and chunking is not needed
- [ ] Use trickle ICE by decoupling SDP processing and ICE candidate processing
- [ ] Handle receiving both offers and answers by managing the corresponding peer connection
- [ ] Handle responding to a given message only once (keep track of offers, answers and candidates received)
- [ ] Select chunk size based on type number and approximate screen size (bigger on desktop, smaller on mobile screen)

## Crediting

### Prior Art

This has been done before and I've attempted it several times before as well.

- (2014) https://franklinta.com/2014/10/19/serverless-webrtc-using-qr-codes/
- (2015) https://github.com/phiresky/webrtc-remote-touch-pen-input
- (2018) https://github.com/AquiGorka/webrtc-qr

Unfortunately, this idea has also been patented in 2018:

https://patents.google.com/patent/US20160021148A1

The patent is invalid as there was prior art before the time of application,
but has been granted and overturning it would require a court challenge.
Until that happens, it's probably unsafe to use this in a commercial product.

I am doing it again because I like the idea and I want to finally put forth a prototype of my own that I'll actually finish.
In the future I'd like to explore ways of bringing down the time required to establish the peer connection.

### Packages Used

- QR code reading: `jsQR`
  - [GitHub](https://github.com/cozmo/jsQR)
  - [npm](https://www.npmjs.com/package/jsqr)
- QR code generation: `qrcode-generator`
  - [GitHub](https://github.com/kazuhikoarase/qrcode-generator)
  - [npm](https://www.npmjs.com/package/qrcode-generator)
