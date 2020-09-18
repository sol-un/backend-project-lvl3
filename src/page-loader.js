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
  const { hostname, pathname } = url;
  const filename = formatPath(hostname, pathname, '.html');
  const filepath = path.join(dest, filename);
  const dirname = formatPath(hostname, pathname, '_files');
  const dirpath = path.join(dest, dirname);
  let assetsData;
  log(`requesting ${link}`);
  return axios.get(link)
    .then((response) => {
      log(`received response from ${link}`);
      let contents;
      [contents, assetsData] = parse(response.data, url, dirpath, dirname);
      return fs.writeFile(filepath, contents, 'utf8');
    })
    .then(() => {
      log(`saved page at ${link}.`);
      return fs.mkdir(dirpath);
    })
    .then(() => {
      const tasks = assetsData.map(defineTask);
      const runner = new Listr(tasks, { concurrent: true, exitOnError: false });
      log('downloading assets...');
      return runner.run();
    })
    .then(() => filename)
    .catch((error) => {
      const errorBlock = error.errors?.reduce(
        (acc, err) => acc.concat(`- ${err.message}\n`),
        "Page was downloaded, but it's missing some assets:\n",
      ) ?? '';
      log(`failed: ${error.message}.\n${errorBlock}`);
      throw new Error(`${error.message}.\n${errorBlock}`);
    });
};
