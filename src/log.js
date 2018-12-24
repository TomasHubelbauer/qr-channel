const mode = 'body';
let logsP;
export default function log(message) {
  switch (mode) {
    case 'log': {
      console.log(message);
      break;
    }
    case 'alert': {
      alert(message);
      break;
    }
    case 'body': {
      if (logsP === undefined) {
        logsP = document.querySelector('#logsP');
      }

      logsP.appendChild(message instanceof Node ? message : document.createTextNode(message + '\n'));
      break;
    }
    default: {
      throw new Error(`Unexpected mode '${mode}'.`);
    }
  }
}
