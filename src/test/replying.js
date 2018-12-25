export default async function replying(onReply) {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    const canvas = document.createElement('canvas');
    canvas.width = codeCanvas.width + 100;
    canvas.height = codeCanvas.height + 100;
    const context = canvas.getContext('2d');
    context.drawImage(codeCanvas, 50, 50);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Deep fry the image, maybe it needs to be more photo-like to get recognized? ¯\_(ツ)_/¯
    // https://github.com/TomasHubelbauer/canvas-chromatic-abberation
    const intensity = 5;
    const phase = 0;
    for (let i = phase % 4; i < imageData.data.length; i += 4) {
      // Setting the start of the loop to a different integer will change the aberration color, but a start integer of 4n-1 will not work
      imageData.data[i] = imageData.data[i + 4 * intensity];
    }
    
    const viewfinderCanvas = document.querySelector('#viewfinderCanvas');
    const viewfinderContext = viewfinderCanvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    viewfinderContext.putImageData(imageData, 0, 0);
    
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    console.log(canvas.toDataURL(), code);
    if (code !== null && code.data !== '') {
      // TODO: Interpret the code given own state and reply using `onReply`
    }
    
    await new Promise(resolve => window.setTimeout(resolve, 1000));
  }
}
