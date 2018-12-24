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

      logsP.appendChild(typeof message === 'string' ? document.createTextNode(message + '\n') : message);
      break;
    }
    default: {
      throw new Error(`Unexpected mode '${mode}'.`);
    }
  }
}
