#!/usr/bin/env node

import program from 'commander';
import pageLoader from '../src/page-loader.js';

program
  .version('1.0.0', '-V, --version', 'output the version number')
  .description('Compares two config files and shows the difference.')
  .helpOption('-h, --help', 'output usage information')
  .option('-o, --output [path]', 'specify the download directory; working directory used by default')
  .arguments('<address> [output]')
  .action((address) => {
    pageLoader(address, program.output);
  })
  .parse(process.argv);