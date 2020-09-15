import { promises as fs } from 'fs';
import Listr from 'listr';
import process from 'process';
import axios from 'axios';
import path from 'path';
import parse from './page-parser.js';
import defineTask from './task-definer.js';
import { formatPath, log } from './utils.js';

export default (link, dest = process.cwd()) => {
  const url = new URL(link);
  const filename = formatPath(url.hostname, url.pathname, '.html');
  const filepath = path.join(dest, filename);
  const dirname = formatPath(url.hostname, url.pathname, '_files');
  const dirpath = path.join(dest, dirname);
  let assetsData;
  log(`requesting ${link}`);
  return axios.get(link)
    .then((response) => {
      log(`received response from ${link}`);
      let contents;
      [contents, assetsData] = parse(response.data, url, dirpath, dirname);
      return fs.writeFile(filepath, contents);
    })
    .then(() => {
      log(`saved page at ${link}.`);
      return fs.mkdir(dirpath);
    })
    .then(() => {
      const tasks = assetsData.map(defineTask);
      const runner = new Listr(tasks, { concurrent: true, exitOnError: false });
      return runner.run();
    })
    .then(() => filename)
    .catch((error) => {
      log(`failed: ${error.message}`);
      throw error;
    });
};
