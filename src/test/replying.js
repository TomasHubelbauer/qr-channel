export default async function replying() {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    await new Promise(resolve => window.setTimeout(resolve, 100));
    const message = codeCanvas.title;
    if (message === '') {
      continue;
    }
    
    window.parent.postMessage({ name: window.location.hash.slice(1), message }, '*');
  }
}
