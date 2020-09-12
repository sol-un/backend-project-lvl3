import path from 'path';
import debug from 'debug';

const formatPath = (base, name, postfix) => path.join(base, name)
  .match(/[A-Z]{2,}(?=[A-Za-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g)
  .map((char) => char.toLowerCase())
  .join('-')
  .concat(postfix);

const log = (message) => debug('page-loader')(message);

export { formatPath, log };
