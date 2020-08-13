import { test, expect } from '@jest/globals';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import nock from 'nock';
import pageLoader from '../index.js';

let tempDir;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('Page loader', async () => {
  nock(/test\.com/)
    .get('/testfile')
    .reply(200, 'test page content');

  await pageLoader('https://test.com/testfile', tempDir);
  const contents = await fs.readFile(path.join(tempDir, 'test-com-testfile.html'), 'utf8');

  expect(contents).toEqual('test page content');
});
