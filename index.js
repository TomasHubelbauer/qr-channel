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

  /*
    The order of the following fields differs in Chrome and in Firefox
    Chrome: aGroup, aMsid, mApp, c, aIceUfrag, aIcePwd, aIceOpts, aFingerprint, aSetup, aMid, aSctpMap
    Firefox: aFingerprint, aGroup, aIceOpts, aMsic, mApp, c, aSendRecv, aIcePwd, aIceUfrag, aMid, aSetup, aSctpPort, aMax
  */

  // Chrome gives shorter `ufrag` (4 vs 8) and `pwd` (24 vs 32), interestingly, in any case both need to specially encoded
  // The Firefox password is GUID serialized and lowercased, we could use that and use upper then lower it ourselves and save data
  yield 'a=ice-ufrag:...';
  yield 'a=ice-pwd:...';
  // Same
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

const vLineRegex = /^v=0$/g;
const oLineRegex = /^o=.* (\d+) (\d+) IN IP4 (\d+.\d+.\d+.\d)+$/g;
const sLineRegex = /^s=-$/g;
const tLineRegex = /^t=0 0$/g;
const aFingerprintLineRegex = /^a=fingerprint:sha-256 (([0-9a-fA-F]{2}:){31}[0-9a-fA-F]{2})$/g;
const aGroupLineRegex = /^a=group:BUNDLE (\w+)$/g;
const aIceOptionsLineRegex = /^a=ice-options:trickle$/g;
const aMsidSemanticLineRegex = /^a=msid-semantic:\s?WMS(\s\*)?$/g;
const mLineRegex = /^m=application 9 (UDP\/)?DTLS\/SCTP (5000|webrtc-datachannel)$/g;
const cLineRegex = /^c=IN IP4 0\.0\.0\.0$/g;
const aSendRecvLineRegex = /^a=sendrecv$/;
const aIceUfragLineRegex = /^a=ice-ufrag:(.*)$/g;
const aIcePwdLineRegex = /^a=ice-pwd:(.*):$/g;

function test(sdp) {
  const lines = [];
  let match;
  const data = {};
  for (const line of sdp.sdp.split(/\r\n/g)) {
    if ((match = vLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = oLineRegex.exec(line)) !== null) {
      const [_, sessionId, sessionVersion, ipv4] = match;
      data.sessionId = sessionId;
      // TODO: See if we can get away with sticking to a zero for this (even though Chrome sets it to 2, Firefox to 0)
      data.sessionVersion = sessionVersion;
      // TODO: See if we can get away with sticking to localhost or 0.0.0.0 for this even though Chrome and Firefox differ
      data.ipv4 = ipv4;
    } else if ((match = sLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = tLineRegex.exec(line)) !== null) {
      // Ignore, no data
    } else if ((match = aFingerprintLineRegex.exec(line)) !== null) {
      const [_, hash] = match;
      // TODO: Remove the colons and figure out how to handle case (escaping)
      data.hash = hash;
    } else if ((match = aGroupLineRegex.exec(line)) !== null) {
      const [_, name] = match;
      // TODO: Find out if this can be changed to a dash assuming the same change is applied to the `a=mid` line
      data.name = name;
    } else if ((match = aIceOptionsLineRegex.exec(line)) !== null) {
       // Ignore, no data
    } else if ((match = aMsidSemanticLineRegex.exec(line)) !== null) {
       // Ignore, browsers set different values (Chrome ` WMS`, Firefox `WMS *`), but `WMS` works for both
    } else if ((match = mLineRegex.exec(line)) !== null) {
      // TODO: Parse out which of the two types it is and set a bit indicating that, also consider the `a=stcp*` line
      data.todo = line;
    } else if ((match = cLineRegex.exec(line)) !== null) {
       // Ignore, no data
    } else if ((match = aSendRecvLineRegex.exec(line)) !== null) {
      // Ignore, optional
    } else if ((match = aIceUfragLineRegex.exec(line)) !== null) {
      data.ufrag = match[1];
    } else if ((match = aIcePwdLineRegex.exec(line)) !== null) {
      data.pwd = match[1];
    } else {
      console.log(line);
      lines.push(line);
    }
  }
  
  const value = [
    'v=0',
    `o=- ${data.sessionId} ${data.sessionVersion} IN IP4 ${data.ipv4}`,
    's=-',
    't=0 0',
    `a=fingerprint:sha-256 ${data.hash}`,
    `a=group:BUNDLE ${data.name}`,
    'a=ice-options:trickle',
    'a=msid-semantic:WMS',
    // TODO: Read the kind bit and print the right line
    data.todo,
    'c=IN IP4 0.0.0.0',
    `a=ice-ufrag:${data.ufrag}`,
    `a=ice-pwd:${data.pwd}`,
    ...lines,
  ].join('\r\n');
  console.log(value);
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
- It is possible to use a dash for session ID even though Firefox sets it (Chrome uses dash)


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
