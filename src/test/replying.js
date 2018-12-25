export default async function replying(onReply) {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    const canvas = document.createElement('canvas');
    canvas.width = codeCanvas.width + 10;
    canvas.height = codeCanvas.height + 10;
    const context = canvas.getContext('2d');
    context.drawImage(codeCanvas, 5, 5);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    console.log(canvas.toBaseURI(), code);
    if (code !== null && code.data !== '') {
      // TODO: Interpret the code given own state and reply using `onReply`
    }
    
    await new Promise(resolve => window.setTimeout(resolve, 1000));
  }
}
