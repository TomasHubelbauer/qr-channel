export default async function replying(onMessage) {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    onMessage(codeCanvas.title);
    await new Promise(resolve => window.setTimeout(resolve, 1000));
  }
}
