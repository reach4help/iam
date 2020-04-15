import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import stringify from 'json-stable-stringify';
import mkdirp from 'mkdirp';

import {config as enableDotenv} from 'dotenv';

import { getData } from './database';
import { calculateAccess } from './access';
import { commitGithubAccess } from './integration/github';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

enableDotenv();

const DIR_DATA = path.join(path.dirname(__dirname), 'data');
const FILE_DATABASE = path.join(DIR_DATA, 'data.json');
const FILE_ACCESS = path.join(DIR_DATA, 'access.json');

(async () => {

  const cmd = process.argv[2];

  switch(cmd) {
    case 'get-data': {
      const data = await getData();
      await mkdirp(path.dirname(FILE_DATABASE));
      await writeFile(FILE_DATABASE, stringify(data, { space: '  ' }));
      break;
    }
    case 'calculate-access': {
      const data = JSON.parse(await (await readFile(FILE_DATABASE)).toString());
      const access = await calculateAccess(data);
      console.log(stringify(access, { space: '  ' }));
      await mkdirp(path.dirname(FILE_ACCESS));
      await writeFile(FILE_ACCESS, stringify(access, { space: '  ' }));
      break;
    }
    case 'commit-access': {
      const access = JSON.parse(await (await readFile(FILE_ACCESS)).toString());
      await commitGithubAccess(access);
      break;
    }
    default: {
      console.log('Unknown Command:', cmd);
      process.exit(1);
    }
  }
})();