#!/usr/bin/env node

import program from 'commander';
import pageLoader from '../src/page-loader.js';

program
  .version('1.0.0', '-V, --version', 'output the version number')
  .description("Downloads a web page (or what's available of it anyway) for off-line viewing.")
  .helpOption('-h, --help', 'output usage information')
  .option('-o, --output [path]', 'specify the download directory; working directory used by default')
  .arguments('<address> [output]')
  .action((address) => pageLoader(address, program.output)
    .then((filename) => console.log(`Downloaded as ${filename}`))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    }))
  .parse(process.argv);
