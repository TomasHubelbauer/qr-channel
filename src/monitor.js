export default function monitor(obj, label, fields) {
  for (const key in obj) {
    if (!/^on/.test(key)) {
      continue;
    }

    obj.addEventListener(key.slice(2), event => {
      let field;
      if (fields && fields[key]) {
        field = fields[key](event);
        console.log(label, key, field);
      } else {
        console.log(label, key);
      }
    });
  }
}
