export default async function replying(onMessage) {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    console.log(JSON.stringify(codeCanvas.title));
    onMessage(codeCanvas.title);
    await new Promise(resolve => window.setTimeout(resolve, 1000));
  }
}
