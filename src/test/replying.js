export default async function replying(onMessage) {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    await new Promise(resolve => window.setTimeout(resolve, 1000));
    const message = codeCanvas.title;
    if (message === '') {
      continue;
    }
    
    onMessage(codeCanvas.title);
  }
}
