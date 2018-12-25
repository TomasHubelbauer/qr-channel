export default function replying(onReply) {
  const codeCanvas = document.querySelector('#codeCanvas');
  while (true) {
    const context = codeCanvas.getContext('2d');
    const imageData = context.getImageData(0, 0, codeCanvas.width, codeCanvas.height);
    if (code !== null && code.data !== '') {
      console.log(code.data);
      // TODO: Interpret the code given own state and reply using `onReply`
    }
  }
}
