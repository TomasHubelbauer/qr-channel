const mode = 'body';
let logsP;
export default function monitor(obj, label) {
  for (const key in obj) {
    if (!/^on/.test(key)) {
      continue;
    }

    obj.addEventListener(key.slice(2), event => {
      switch (mode) {
        case 'log': {
          console.log(label, key, event);
          break;
        }
        case 'alert': {
          alert(label + ' ' + key + ' ' + JSON.stringify(event));
          break;
        }
        case 'body': {
          if (logsP === undefined) {
            logsP = document.querySelector('#logsP');
          }
          
          logsP.appendChild(document.createTextNode(label + ' ' + key + ' ' + JSON.stringify(event) + '\n'));
          break;
        }
        default: {
          throw new Error(`Unexpected mode '${mode}'.`);
        }
      }
    });
  }
}
