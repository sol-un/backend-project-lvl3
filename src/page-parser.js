import path from 'path';
import cheerio from 'cheerio';
import { formatPath } from './utils.js';

const dispatcherByTagName = {
  script: () => 'src',
  img: () => 'src',
  link: () => 'href',
};

export default (contents, url, dirpath, dirname) => {
  const $ = cheerio.load(contents);
  const assetsData = [];
  $('img, script, link')
    .each((_i, tag) => {
      const attrName = dispatcherByTagName[tag.tagName](tag);
      const attrValue = $(tag).attr(attrName);
      if (attrValue && (attrValue.includes(url.hostname) || !attrValue.includes('http'))) {
        const {
          dir, base, name, ext,
        } = path.parse(attrValue);
        const assetName = formatPath(dir, name, ext);
        const assetObj = {
          base,
          link: new URL(attrValue, url.href).toString(),
          path: path.join(dirpath, assetName),
        };
        assetsData.push(assetObj);
        $(tag).attr(attrName, path.join(dirname, assetName));
      }
    });
  return [$.html(), assetsData];
};
