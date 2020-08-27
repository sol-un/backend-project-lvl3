import { promises as fs } from 'fs';
import Listr from 'listr';
import process from 'process';
import axios from 'axios';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';

const formatPath = (base, name, postfix) => path.join(base, name)
  .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
  .map((char) => char.toLowerCase())
  .join('-')
  .concat(postfix);

const dispatcherByTagName = {
  script: () => 'src',
  img: () => 'src',
  link: () => 'href',
};

const log = debug('page-loader');

export default (link, dest = process.cwd()) => {
  const url = new URL(link);
  const filename = formatPath(url.hostname, url.pathname, '.html');
  const dirname = formatPath(url.hostname, url.pathname, '_files');
  const assetsData = [];
  log(`requesting ${link}`);
  return axios.get(link)
    .then((response) => {
      log(`received response from ${link}`);
      const $ = cheerio.load(response.data);
      $('img, script, link')
        .filter((_i, tag) => $(tag).attr('src') || $(tag).attr('href'))
        .each((_i, tag) => {
          const attrName = dispatcherByTagName[tag.tagName](tag);
          const attrValue = $(tag).attr(attrName);
          if (attrValue.includes(url.hostname) || !attrValue.includes('http')) {
            const parsedPath = path.parse(attrValue);
            const assetObj = {
              link: new URL(attrValue, url.origin).toString(),
              path: path.join(dirname, formatPath(parsedPath.dir, parsedPath.name, parsedPath.ext)),
            };
            assetsData.push(assetObj);
            $(tag).attr(`${attrName}`, assetObj.path);
          }
        });
      return fs.writeFile(path.join(dest, filename), $.html())
        .then(() => log(`saved page at ${link}.`))
        .catch((error) => {
          const message = `${error.message}. Failed to save '${filename}'`;
          log(`failed: ${message}`);
          console.error(message);
          throw error;
        });
    })
    .then(() => {
      fs.mkdir(path.join(dest, dirname));
      const taskArr = assetsData.map((item) => ({
        title: `Downlading ${item.link}`,
        task: () => axios({
          url: item.link,
          method: 'get',
          responseType: 'arraybuffer',
        }).then((response) => {
          const filepath = path.join(dest, item.path);
          return fs.writeFile(filepath, response.data)
            .then(() => log(`saved file ${item.path}`));
        }).catch((error) => {
          const message = `${error.message}. Failed to load '${error.config.url}'`;
          log(`failed: ${message}`);
          console.error(message);
          throw error;
        }),
      }));
      const tasks = new Listr(taskArr, { concurrent: true });
      return tasks;
    })
    .then((tasks) => tasks.run())
    .then(() => `Page downloaded as ${filename}`)
    .catch((error) => {
      const message = `${error.message}. Failed to load '${error.config.url}`;
      log(`failed: ${message}`);
      console.error(message);
      throw error;
    });
};
