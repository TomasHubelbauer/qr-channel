import sleep from "../sleep";

// TODO: Change this to an async iterator once browser support is there https://github.com/Fyrd/caniuse/issues/3690
export default async function scan(onMessage, source) {
  while (true) {
    const code = (source || sourceCodeCanvas)();
    if (code) {
      onMessage(code);
    }

    await sleep(100);
  }
}

function sourceCodeCanvas() {
  /** @type {HTMLCanvasElement|null} */
  const codeCanvas = document.querySelector('#codeCanvas');
  if (codeCanvas === null) {
    throw new Error('The #codeCanvas element was not found.');
  }

  return codeCanvas.title;
}
