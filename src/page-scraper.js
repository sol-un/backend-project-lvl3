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
    .filter((_i, tag) => $(tag).attr('src') || $(tag).attr('href'))
    .each((_i, tag) => {
      const attrName = dispatcherByTagName[tag.tagName](tag);
      const attrValue = $(tag).attr(attrName);
      if (attrValue.includes(url.hostname) || !attrValue.includes('http')) {
        const parsedPath = path.parse(attrValue);
        const assetName = formatPath(parsedPath.dir, parsedPath.name, parsedPath.ext);
        const assetObj = {
          link: new URL(attrValue, url.origin).toString(),
          path: path.join(dirpath, assetName),
        };
        assetsData.push(assetObj);
        $(tag).attr(attrName, path.join(dirname, assetName));
      }
    });
  return [$.html(), assetsData];
};
