import { test, expect } from '@jest/globals';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import nock from 'nock';
import cheerio from 'cheerio';
import pageLoader from '../index.js';

const getFixturePath = (filepath) => path.join(path.resolve(), '__fixtures__', filepath);
let tempDir;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('Page loader', async () => {
  nock(/test\.com/)
    .get('/test_page')
    .replyWithFile(200, getFixturePath(path.join('before', 'test_page.html')))
    .get('/styles.css')
    .replyWithFile(200, getFixturePath(path.join('before', 'styles.css')))
    .get('/assets/placeholder_image.png')
    .replyWithFile(200, getFixturePath(path.join('before', 'assets', 'placeholder_image.png')))
    .get('/assets/script.js')
    .replyWithFile(200, getFixturePath(path.join('before', 'assets', 'script.js')));

  await pageLoader('https://test.com/test_page', tempDir);
  const actualPage = await fs.readFile(path.join(tempDir, 'test-com-test-page.html'), 'utf8');
  const expectedPage = await fs.readFile(getFixturePath(path.join('after', 'test-com-test-page.html')), 'utf8');
  const actualAssets = await fs.readdir(path.join(tempDir, 'test-com-test-page_files'));
  const expectedAssets = await fs.readdir(getFixturePath(path.join('after', 'test-com-test-page_files')));

  expect(cheerio.load(actualPage).html()).toBe(cheerio.load(expectedPage).html());
  expect(actualAssets).toStrictEqual(expectedAssets);
});
