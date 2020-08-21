import { promises as fs } from 'fs';
import process from 'process';
import axios from 'axios';
import path from 'path';
import cheerio from 'cheerio';

const dispatcherByTagName = {
  script: () => 'src',
  img: () => 'src',
  link: () => 'href',
};

export default (link, dest = process.cwd()) => {
  const url = new URL(link);
  const filename = `${url.hostname}${url.pathname}`.replace(/([^\d\w]|_)/g, '-').concat('.html');
  const dirname = `${url.hostname}${url.pathname}`.replace(/([^\d\w]|_)/g, '-').concat('_files');
  const assetsData = [];
  return axios.get(link)
    .then((response) => {
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
      fs.writeFile(path.join(dest, filename), $.html());
    })
    .then(() => {
      fs.mkdir(path.join(dest, dirname));
      const promiseArr = assetsData.map((item) => axios({
        url: item.link,
        method: 'get',
        responseType: 'arraybuffer',
      }).then((response) => {
        fs.writeFile(path.join(dest, item.path), response.data);
      }));
      return Promise.all(promiseArr);
    });
};
