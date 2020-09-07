import path from 'path';
import debug from 'debug';

const formatPath = (base, name, postfix) => path.join(base, name)
  .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
  .map((char) => char.toLowerCase())
  .join('-')
  .concat(postfix);

const log = (message) => debug('page-loader')(message);

export { formatPath, log };
