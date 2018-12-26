import log from './log.js';

export default function monitor(obj, label) {
  for (const key in obj) {
    if (!/^on/.test(key)) {
      continue;
    }

    obj.addEventListener(key.slice(2), _ => log(label + ' ' + key));
  }
}
