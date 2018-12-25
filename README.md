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

- [ ] Finalize `reply.js` response flow until successful data channel opening
- [ ] Try encoding ICE like SDP so it might fit on a single QR code and we'd alternate only two QR codes, SDP and ICE
- [ ] Allow alternating between portrait and environment camera in development
  - The portrait one is production screen to screen workflow where the user ideally doesn't need to watch both screens
  - The environment one is development sequential workflow where screens are watched to aid debugging
  - [ ] Document this in the Debugging section above once added
- [ ] Set up Azure Pipelines build which runs TypeScript over the solution and does JavaScript checking on the repository
- [ ] Fix `broadcast.js` so that it only ever loops one thing at once, break out if the previous loop before starting the next
- [ ] Consider changing the format to `(ID)(O/A)(hash)(ufrag):(pwd)` so that we can drop the session ID length character

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
