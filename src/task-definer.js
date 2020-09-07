import { promises as fs } from 'fs';
import axios from 'axios';
import { log } from './utils.js';

export default (item) => ({
  title: `Downloading ${item.link}`,
  task: () => axios({
    url: item.link,
    method: 'get',
    responseType: 'arraybuffer',
  }).then((response) => fs.writeFile(item.path, response.data)
    .then(() => log(`saved file ${item.path}`))),
});
