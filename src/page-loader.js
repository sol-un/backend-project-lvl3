import { promises as fs } from 'fs';
import process from 'process';
import axios from 'axios';
import path from 'path';

export default (link, dest = process.cwd()) => {
  const url = new URL(link);
  const filename = `${url.hostname}${url.pathname}`.replace(/[^\d\w]/g, '-').concat('.html');
  return axios.get(link)
    .then((response) => {
      fs.writeFile(path.join(dest, filename), response.data, 'utf8');
    });
};
