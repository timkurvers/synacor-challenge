/* eslint-disable no-await-in-loop */

import Analyzer from './src/Analyzer';
import Program from './src/Program';

const path = process.argv[2];
if (!path) {
  console.error('No program specified');
  process.exit(1);
}

(async () => {
  const program = new Program(path);
  const analyzer = new Analyzer();
  analyzer.load(program);
  await analyzer.visualize('./visualizations/synacore-map.dot');
})();
