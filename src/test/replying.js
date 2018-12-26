export default async function replying(onMessage) {
  /** @type {HTMLCanvasElement|null} */
  const codeCanvas = document.querySelector('#codeCanvas');
  if (codeCanvas === null) {
    throw new Error('The #codeCanvas element was not found.');
  }
  
  window.addEventListener('message', event => {
    onMessage(event.data);
  });
  
  while (true) {
    await new Promise(resolve => window.setTimeout(resolve, 100));
    const message = codeCanvas.title;
    if (message === '') {
      continue;
    }
    
    window.parent.postMessage({ name: window.location.hash.slice(1), message }, '*');
  }
}
