const bodyParser = require('body-parser');

const rProto = /__proto__/i;
const rPrototype = /prototype[=[\]]/i;
const rConstructor = /constructor[=[\]]/i;

module.exports = bodyParser.urlencoded({
  extended: true,
  verify: (req, res, buf, encoding) => {
    const body = decodeURI(buf.toString(encoding));
    if (rProto.test(body) || rPrototype.test(body) || rConstructor.test(body)) {
      throw new Error('Request body verification failed');
    }
  },
});
