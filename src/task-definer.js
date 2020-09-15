import { promises as fs } from 'fs';
import axios from 'axios';
import { log } from './utils.js';

export default ({ link, path }) => ({
  title: `Downloading ${link}`,
  task: () => axios({
    url: link,
    method: 'get',
    responseType: 'arraybuffer',
  }).then((response) => fs.writeFile(path, response.data))
    .then(log(`saved file at ${link}`)),
});
