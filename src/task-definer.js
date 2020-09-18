import { promises as fs } from 'fs';
import axios from 'axios';
import { log } from './utils.js';

export default ({ base, link, path }) => ({
  title: `Downloading ${link}`,
  task: () => axios({
    url: link,
    method: 'get',
    responseType: 'arraybuffer',
  }).then((response) => {
    log(`saved file at ${link}`);
    return fs.writeFile(path, response.data);
  }).catch((error) => {
    throw new Error(`Problem loading '${base}'. ${error.message}`);
  }),
});
