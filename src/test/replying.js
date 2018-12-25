export default async function replying(onReply) {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    console.log(codeCanvas.title);
    
    await new Promise(resolve => window.setTimeout(resolve, 1000));
  }
}
