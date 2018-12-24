# [QR Channel](https://tomashubelbauer.github.io/qr-channel/)

This is an experiment in establishing WebRTC peer connection with a data channel between two devices equipped with web cams by
exchanging QR codes with offer/answer SDP data and ICE candidate data.

## Running

[Demo](https://tomashubelbauer.github.io/qr-channel/)

## Debugging

- Clear iOS Safari website cache: Settings > Safari > Advanced > Website Data > `tomashubelbauer.github.io` > swipe to clear
- Make sure you are not using the camera in another browser/tab if Chrome gives you a blank stream (2×2 pixels)

## Contributing

GitHub issues are closed, use a pull request to start discussion about a patch or email me at tomas@hubelbauer.net.

### Roadmap

Also see the `TODO` comments in the source code and MarkDown checkboxen in the other MarkDown files.

- [ ] Consider compressing ICE similarly to SDP so they might all fit on 1 QR code (not N) and we'd be rotating only 2 QR codes
- [ ] Handle receiving both offers and answers by managing the corresponding peer connections
- [ ] Handle responding to a given message only once (keep track of offers, answers and candidates processed)

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
