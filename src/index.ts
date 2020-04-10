import {config as enableDotenv} from 'dotenv';

import { getData } from './database';

enableDotenv();

console.log('hello world');

getData();