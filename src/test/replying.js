export default async function replying(onReply) {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    const context = codeCanvas.getContext('2d');
    const imageData = context.getImageData(0, 0, codeCanvas.width, codeCanvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    console.log(code);
    if (code !== null && code.data !== '') {
      // TODO: Interpret the code given own state and reply using `onReply`
    }
    
    await new Promise(resolve => window.setTimeout(resolve, 1000));
  }
}
