# [QR Channel](https://tomashubelbauer.github.io/qr-channel/)

This is an experiment in establishing WebRTC peer connection with a data channel between two devices equipped with web cams by
exchanging QR codes with offer/answer SDP data and ICE candidate data.

I also have a Web Bluetooth based solution in the works, [BT Channel](https://github.com/TomasHubelbauer/bt-channel).

## Running

[
  ![](https://dev.azure.com/tomashubelbauer/QR%20Channel/_apis/build/status/QR%20Channel-CI?branchName=master)
](https://dev.azure.com/tomashubelbauer/QR%20Channel/_build/latest?definitionId=7?branchName=master)

Please note that the above badge corresponds to a strict TypeScript type check status.
There is no build per se as this is a static file JavaScript project hosted using GitHub Pages
with an [**online demo** at tomashubelbauer.github.io/qr-channel](https://tomashubelbauer.github.io/qr-channel/).

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

### Roadmap

Also see the `TODO` comments in the source code and MarkDown checkboxen in the other MarkDown files.

- [ ] Fix the error  thrown in Safari in the flow: phone offers, laptop sees and answers, phone sees and throws on remote SDP
      `OperationError: Failed to set remote answer sdp: The order of m-lines in answer doesn't match order in offer.`
- [ ] Finalize `reply.js` response flow until successful data channel opening
- [ ] Try encoding ICE like SDP so it might fit on a single QR code and we'd alternate only two QR codes, SDP and ICE
- [ ] Consider changing the format to `(ID)(O/A)(hash)(ufrag):(pwd)` so that we can drop the session ID length character
- [ ] Consider using JSDoc to aid TypeScript with type checking
- [ ] Add `npm install` of packages used to the CI definition or introduce `package.json` with TypeScript and them for typings
- [ ] Move `test.js` to `test/coding.js` and introduce a new rig `test/scanning.js` which mocks the iPhone side for easy debug

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
