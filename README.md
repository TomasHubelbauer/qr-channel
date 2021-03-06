# [QR Channel](https://tomashubelbauer.github.io/qr-channel/)

[**LIVE**](https://tomashubelbauer.github.io/qr-channel/)

This is an experiment in establishing WebRTC peer connection with a data channel between two devices equipped with web cams by
exchanging QR codes with offer/answer SDP data and ICE candidate data.

I also have a Web Bluetooth based solution in the works, [BT Channel](https://github.com/TomasHubelbauer/bt-channel).

## Running

`start index.html`

## Debugging

- Use the video and canvas views in portrait to be able to verify that video to canvas drawing works correctly
- Use the facing mode selector in portrait to switch between environment and use facing modes
  - The user mode is production screen-to-screen workflow where the user faces the phone to the laptop and the devices connect
  - The environment mode is debugging sequential workflow where the developer alternates the screens to guide the flow and debug
- Clear iOS Safari website cache: Settings > Safari > Advanced > Website Data > `tomashubelbauer.github.io` > swipe
- Make sure your iPhone is not in the power saver mode, otherwise camera access won't be granted to the page
- Make sure you are not using the camera in another browser/tab if Chrome gives you a blank stream (2×2 pixels)

## Contributing

GitHub issues are closed, use a pull request to start discussion about a patch or email me at tomas@hubelbauer.net.

The PR will be type checked before it can be merged. This is a JavaScript project which uses JSDoc through TypeScript.

## To-Do

### Finalize `reply.js` using [the test rig](https://github.com/TomasHubelbauer/qr-channel/src/test/replying)

Verify with real devices

### Test that the candidate `melt` function works in the coding test laying ground for the ICE compression/decompression

### Compress and decompress ICE in `encode` & `melt`, fit multiple into a QR code (limit to type number 5)

### Figure out [this problem](https://stackoverflow.com/q/53958469/2715716) and fix `jsQR` not being seen by TypeScript

### See if jsQR maintainers [find a way](https://github.com/cozmo/jsQR/issues/108)

### See if it could be possible to pull the dependencies as ES native modules

- https://github.com/kazuhikoarase/qrcode-generator/issues/65
- https://github.com/cozmo/jsQR/issues/107

## Crediting

### Prior Art

This has been done before and I've attempted it several times before as well.

- (2014) [serverless-webrtc-qrcode](https://github.com/fta2012/serverless-webrtc-qrcode) by [fta2012](https://github.com/fta2012)
- (2015) [webrtc-remote-touch-pen-input](https://github.com/phiresky/webrtc-remote-touch-pen-input) by [phiresky](https://github.com/phiresky)
- (2018) [webrtc-qr](https://github.com/AquiGorka/webrtc-qr) by [AquiGorka](https://github.com/AquiGorka)

Unfortunately, this idea has also [been patented](https://patents.google.com/patent/US20160021148A1) in 2018.

I hope that the patent is invalid as there was prior art before the time of application, but has been granted and overturning
it would require a court challenge I think. Until that happens, it's probably unsafe to use this in a commercial product.

I am doing it again because I like the idea and I want to finally put forth a prototype of my own that I'll actually finish.
In the future I'd like to explore ways of bringing down the time required to establish the peer connection.

### Packages Used

#### `jsQR` by [@cozmo](https://github.com/cozmo): reading QR codes from `ImageData`

- [GitHub](https://github.com/cozmo/jsQR)
- [npm](https://www.npmjs.com/package/jsqr)

#### `qrcode-generator` by [@kazuhikoarase](https://github.com/kazuhikoarase): calculating QR code modules for drawing on `canvas`

- [GitHub](https://github.com/kazuhikoarase/qrcode-generator)
- [npm](https://www.npmjs.com/package/qrcode-generator)

---

I started working on https://github.com/TomasHubelbauer/js-qr-scanner-library-comparison
to see if there is a QR library that is faster or better at scanning than Cozmo's but
that doesn't appear to be the case.

I could also use the JavaScript QR reader on desktop only because phones have a built-in
one these days. But it would probably be better to make the roles explicit in tha case
and simplify the flow:

- User opens the camera app on their phone and set it to the selfie camera
- User opens the web app and an offer code is automatically displayed and answer scanning started
- User scans the offer code by pointing the phone's display to the latop screen (which makes the latop see the phone screen)
- The QR scanner on the phone finds the offer code and opens the browser with the offer in the URL which shows the answer
- The web app scan its field of view until it sees the answer code at which point the flow end
- A WebRTC connection using the offer and the answer is established

On Android the QR scanner is in Camera app settings under *Google Lens Suggestions*.

On iOS the QR scanner is a widget that can be added to the Control Centre and starts camera with scanning enabled.
