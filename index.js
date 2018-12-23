window.addEventListener('load', async () => {
  // Bail while we're playing with the SDP rig
  return;
  const viewfinderVideo = document.querySelector('#viewfinderVideo');
  const viewfinderCanvas = document.querySelector('#viewfinderCanvas');
  const codeCanvas = document.querySelector('#codeCanvas');
  const signalingStateP = document.querySelector('#signalingStateP');
  const iceGatheringStateP = document.querySelector('#iceGatheringStateP');
  const chunksP = document.querySelector('#chunksP');

   // Remember the context and refresh it when dimensions change
  let codeContext;
  
  const chunks = [];
  
  const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  viewfinderVideo.srcObject = mediaStream;
  // Set this attribute (not class member) through JavaScript (not HTML) to make iOS Safari work
  viewfinderVideo.setAttribute('playsinline', true);
  // Play within the `getUserMedia` gesture, `autoplay` won't work
  await viewfinderVideo.play();

  // Remember the context and refresh it when dimensions change
  let viewfinderContext;
  requestAnimationFrame(function tick() {
    if (viewfinderVideo.readyState === viewfinderVideo.HAVE_ENOUGH_DATA) {
      if (viewfinderCanvas.width !== viewfinderVideo.videoWidth || viewfinderCanvas.height !== viewfinderVideo.videoHeight) {
        viewfinderCanvas.width = viewfinderVideo.videoWidth;
        viewfinderCanvas.height = viewfinderVideo.videoHeight;
        viewfinderContext = viewfinderCanvas.getContext('2d');
      }

      viewfinderContext.drawImage(viewfinderVideo, 0, 0, viewfinderVideo.videoWidth, viewfinderVideo.videoHeight);
      const imageData = viewfinderContext.getImageData(0, 0, viewfinderCanvas.width, viewfinderCanvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code !== null && code.data !== '') {
        const [index, count, text] = code.data.split('\0', 3);
        chunks[index] = text;
        chunksP.textContent = `Chunks (${Object.keys(chunks).length}/${count}): ` + Object.keys(chunks);
        // Check the number of keys to ignore uninitialized array items
        if (Object.keys(chunks).length === Number(count)) {
          // Fire and forget
          connect();
        }
      }
    }

    requestAnimationFrame(tick);
  });
  
  const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
  monitor(peerConnection, 'peerConnection');
  
  peerConnection.addEventListener('signalingstatechange', () => {
    signalingStateP.textContent += peerConnection.signalingState + '; ';
  });
  
  peerConnection.addEventListener('icegatheringstatechange', () => {
    iceGatheringStateP.textContent += peerConnection.iceGatheringState + '; ';
  });
  
  const dataChannel = peerConnection.createDataChannel(null);
  monitor(dataChannel, 'dataChannel');
  
  // Start from -1 so that 0 falls on the non-empty message value (with SDP or ICE candidate SDP in it)
  let counter = -1;
  // TODO: Derive this not from char length but from the type number (have it not be automatic)
  const size = 50;
  
  // Fire and forget now that we have all candidates
  rotate();
  
  // Fire and forget so that we can keep looping messages
  broadcast();
  
  async function broadcast() {
    const sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);
    message += sessionDescription.type + '\0' + sessionDescription.sdp + '\0';
  }
  
  // TODO: Handle both offer and answer cases
  // TODO: Rewrite this to be able to act on partial messages so that collection of chunks and establishment of the connection do not have to be strictly sequential
  async function connect() {
    const peerConnection = new RTCPeerConnection({ iceServers: [ { urls: 'stun:stun.services.mozilla.com' } ] });
    monitor(peerConnection, 'peerConnection');
    
    const dataChannel = peerConnection.createDataChannel('');
    monitor(dataChannel, 'dataChannel');
 
    const message = chunks.join('');
    const parts = message.split('\0');
    
    // TODO: Handle this possible being an answer to own offer and not different offer
    const offer = new RTCSessionDescription({ type: parts[0], sdp: parts[1] });
    await peerConnection.setRemoteDescription(offer);
    
    // TODO: Parse candidates from the groups of three items
    //for (const ) {
    //  const candidate = new RTCIceCandidate({ candidate: iceString, sdpMid: 0, sdpMLineIndex: 0 });
    //  await peerConnection.addIceCandidate(candidate);
    //}
    
    // TODO: Verify only a blank item was left (confirming we're at the end of the candidates)
    
    //const answer = await peerConnection.createAnswer();
    //await peerConnection.setLocalDescription(answer);
    
    alert('done');
  }
  
  async function rotate() {
    const message = peerConnection.getLocalDescription().sdp;
    while (true) {
      const count = Math.ceil(message.length / size);
      const index = counter % count;
      const code = message.substr(index * size, size);
      //console.log({ counter, count, index, message, messageLength: message.length, code, codeLength: code.length });
      displayMessage(`${index}\0${count}\0${code}`);
      await new Promise((resolve, reject) => window.setTimeout(resolve, 100));
      counter++;
    }
  }
    
  function displayMessage(message) {
    const qr = qrcode(0, 'L');
    qr.addData(message, 'Byte');
    qr.make();
    codeCanvas.title = message;

    const { width, height } = codeCanvas.getBoundingClientRect();
    if (codeCanvas.width !== width || codeCanvas.height !== height) {
      codeCanvas.width = width;
      codeCanvas.height = height;
      codeContext = codeCanvas.getContext('2d');
    } else {
      codeContext.clearRect(0, 0, codeCanvas.width, codeCanvas.height);
    }

    const size = Math.min(codeCanvas.width, codeCanvas.height);
    const moduleCount = qr.getModuleCount();
    const cellSize = size / moduleCount;
    const ceilSize = Math.ceil(cellSize);

    const x = (width - size) / 2;
    const y = (height - size) / 2;
    for (let cellX = 0; cellX < moduleCount; cellX++) {
      for (let cellY = 0; cellY < moduleCount; cellY++) {
        if (qr.isDark(cellX, cellY)) {
          codeContext.fillRect(x + cellX * cellSize, y + cellY * cellSize, ceilSize, ceilSize);
        }
      }
    }
  }
});

window.addEventListener('unhandledrejection', event => alert(event.reason));

// Encodes SDP + ICE candidates into a QR alphanumeric string
function encode(sdp) {
  const type = sdp.type;
  const sessionId = sdp;
  const sessionVersion = sdp;
  // TODO: Extra the rest of the bits, then format them to a compact string (including escaping)
  return JSON.stringify({ type });
}

// Decodes SDP + ICE candidates from a QR alphanumeric string
// TODO: Build a test rig that connects to itself within the same browser tab JS context and run the messages thru this and back
function* decode(value) {
  // TODO: Parse and unescape the formatted compressed string and pull out the data bits

  // This is the same in Firefox and in Chrome
  yield 'v=0';
  // This differs in Firefox and Chrome and I am not sure what needs to stay in order for this not to break
  // Ideally `mozilla...THIS_IS_SDPARTA-64.0` would be reduced to just the dash
  // The long number seems to always be 19 digits long
  // The number after it is different in Chrome and Firefox
  // TODO: Find out what it means and if we can skip it
  // The IP address is neutered in both Firefox and Chrome, but Chrome goes with localhost and Firefox with blank IP
  // TODO: Find out if we can choose one that will work for both
  yield 'o=- 0000000000000000000 2 IN IP4 127.0.0.1'; // Chrome
  yield 'o=mozilla...THIS_IS_SDPARTA-64.0 0000000000000000000 0 IN IP4 0.0.0.0';
  // This is the same again
  yield 's=-';
  yield 't=0 0';
  /*
    The order of the following fields differs in Chrome and in Firefox
    In Chrome it goes: group, msid, application, c=IN, ice-ufrag, ice-pwd, ice-opts, fingerprint, setup, mid:data, sct, cands
    In Firefox it goes: fingerprint, group, ice-opts, msid, app, c-IN, a=sendrecv, ice-pwd, ice-ufrag, mid:0, setup, sctport, mms, cands
    TODO: Find out if this can go in one order that will work (it must as Firefox and Chrome can interoperate)
  */

  // Firefox and Chrome differ here again, Firefox says "0" and Chrome says "data"
  yield 'a=group:BUNDLE data'; // Chrome
  yield 'a=group:BUNDLE 0'; // Firefox
  // This differs too
  yield 'a=msid-semantic: WMS'; // Chrome
  yield 'a=msid-semantic:WMS *'; // Firefox
  // Another difference
  yield 'm=application 9 DTLS/SCTP 5000'; // Chrome
  yield 'm=application 9 UDP/DTLS/SCTP webrtc-datachannel'; // Firefox
  // This is the same in both, including the empty IP (whereas in `o=` Chrome gives localhost)
  yield 'c=IN IP4 0.0.0.0';
  // Chrome gives shorter `ufrag` (4 vs 8) and `pwd` (24 vs 32), interestingly, in any case both need to specially encoded
  // The Firefox password is GUID serialized and lowercased, we could use that and use upper then lower it ourselves and save data
  yield 'a=ice-ufrag:...';
  yield 'a=ice-pwd:...';
  // Same
  yield 'a=ice-options:trickle';
  yield 'a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00';
  yield 'a=setup:actpass';
  // This differs the same way `a-msid` does, Chrome gives "data" and Firefox gives "0"
  yield 'a=mid:data'; // Chrome
  yield 'a=mid:0'; // Firefox
  // This is interesting, because now the `webrtc-datachannel` string is given by Chrome and Firefox has a shorter line
  // It looks like this line depends on what you do in the other line
  yield 'a=sctpmap:5000 webrtc-datachannel 1024'; // Chrome
  yield 'a=sctp-port:5000'; // Firefox
  // This is Firefox-only
  yield 'a=sendrecv';
  yield 'a=max-message-size:1073741823';
  
  
  // TODO: Study https://webrtchacks.com/sdp-anatomy/
  // TODO: Study https://webrtchacks.com/the-minimum-viable-sdp/ but keep in mind QR alphanumeric is a bit different here
}

function test(sdp) {
  const lines = sdp.sdp.split(/\r\n/g);
  for (const line of lines) {
    console.log(line);
  }
  
  const value = lines.join('\r\n');
  return new RTCSessionDescription({ type: sdp.type, sdp: value });
}

async function rig() {
  const peerConnection1 = new RTCPeerConnection();
  monitor(peerConnection1, '1');
  const peerConnection2 = new RTCPeerConnection();
  monitor(peerConnection2, '2');
  
  const dataChannel = peerConnection1.createDataChannel(null);
  monitor(dataChannel, 'dc 1');
  
  const offer = test(await peerConnection1.createOffer());
  await peerConnection1.setLocalDescription(offer);
  await peerConnection2.setRemoteDescription(offer);
  const answer = test(await peerConnection2.createAnswer());
  await peerConnection2.setLocalDescription(answer);
  await peerConnection1.setRemoteDescription(answer);
  
  peerConnection1.addEventListener('icecandidate', event => {
    if (event.candidate !== null) {
      peerConnection2.addIceCandidate(event.candidate);
    }
  });
  
  peerConnection2.addEventListener('icecandidate', event => {
    if (event.candidate !== null) {
      peerConnection1.addIceCandidate(event.candidate);
    }
  });
  
  dataChannel.addEventListener('open', () => {
    dataChannel.send('message from 1 to 2');
  });
  
  peerConnection2.addEventListener('datachannel', event => {
    monitor(event.channel, 'dc 2');
      event.channel.addEventListener('open', () => {
        event.channel.send('message from 2 to 1');
      });
  });
}

function monitor(obj, label) {
  for (const key in obj) {
    if (!/^on/.test(key)) {
      continue;
    }

    obj.addEventListener(key.slice(2), event => console.log(label, key, event));
  }
}

// Propagate asynchronous errors to the console
void async function() {
  await rig();
}()

/*
Chrome:

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

Firefox:

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

*/
