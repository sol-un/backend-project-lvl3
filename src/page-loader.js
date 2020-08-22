import { promises as fs } from 'fs';
import process from 'process';
import axios from 'axios';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';

const dispatcherByTagName = {
  script: () => 'src',
  img: () => 'src',
  link: () => 'href',
};
const log = debug('page-loader');
export default (link, dest = process.cwd()) => {
  const url = new URL(link);
  const filename = `${url.hostname}${url.pathname}`.replace(/([^\d\w]|_)/g, '-').concat('.html');
  const dirname = `${url.hostname}${url.pathname}`.replace(/([^\d\w]|_)/g, '-').concat('_files');
  const assetsData = [];
  log(`requesting ${link}`);
  return axios.get(link)
    .then((response) => {
      log(`received response from ${link}`);
      const $ = cheerio.load(response.data);
      $('img, script, link')
        .each((_i, tag) => {
          const attrName = dispatcherByTagName[tag.tagName](tag);
          const attrValue = $(tag).attr(attrName);
          if (attrValue.includes(url.hostname) || !attrValue.includes('http')) {
            const assetObj = {
              link: new URL(attrValue, url.origin).toString(),
              path: path.join(dirname, attrValue.replace(/([^\d\w.]|_)/g, '-')),
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
      const promiseArr = assetsData.map((item) => axios({
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
      }));
      return Promise.all(promiseArr);
    })
    .catch((error) => {
      const message = `${error.message}. Failed to load '${error.config.url}'`;
      log(`failed: ${message}`);
      console.error(message);
      throw error;
    });
};
