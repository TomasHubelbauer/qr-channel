export default async function replying(onMessage) {
  const codeCanvas = document.querySelector('#codeCanvas');
  await new Promise(resolve => window.setTimeout(resolve, 1000));
  while (true) {
    await new Promise(resolve => window.setTimeout(resolve, 100));
    const message = codeCanvas.title;
    if (message === '') {
      continue;
    }
    
    window.setTimeout(onMessage, 2500, codeCanvas.title);
    onMessage(codeCanvas.title);
  }
}
