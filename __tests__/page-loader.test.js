import { test, expect } from '@jest/globals';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import cheerio from 'cheerio';
import nock from 'nock';
import pageLoader from '../index.js';
import { log } from '../src/utils.js';

const getFixturePath = (filepath) => path.join(path.resolve(), '__fixtures__', filepath);
let tempDir;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('Page loader: normal operation', async () => {
  log('testing: normal operation');
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

  await expect(cheerio.load(actualPage).html()).toBe(cheerio.load(expectedPage).html());
  await expect(actualAssets).toStrictEqual(expectedAssets);
});

test('Page loader: network errors', async () => {
  log('testing: network errors');
  nock(/test\.com/)
    .get('/test_page404')
    .reply(404)
    .get('/test_page')
    .replyWithFile(200, getFixturePath(path.join('before', 'test_page.html')))
    .get('/styles.css')
    .reply(404)
    .get('/assets/placeholder_image.png')
    .replyWithFile(200, getFixturePath(path.join('before', 'assets', 'placeholder_image.png')))
    .get('/assets/script.js')
    .reply(404);

  await expect(pageLoader('https://test.com/test_page404', tempDir)).rejects.toThrow('404');
  await expect(pageLoader('https://test.com/test_page', tempDir)).rejects.toThrow(/Something went wrong.*missing some assets/);
});

test('Page loader: file system errors', async () => {
  log('testing: file system errors');
  nock(/test\.com/)
    .persist()
    .get('/test_page')
    .replyWithFile(200, getFixturePath(path.join('before', 'test_page.html')));

  const readOnlyPath = path.join(tempDir, 'read-only');
  await fs.mkdir(readOnlyPath, 444);
  await expect(pageLoader('https://test.com/test_page', readOnlyPath)).rejects.toThrow('EACCES');
  await expect(pageLoader('https://test.com/test_page', 'noexist')).rejects.toThrow('ENOENT');
});
