import {config as enableDotenv} from 'dotenv';

enableDotenv();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

if (!AIRTABLE_API_KEY) {
  throw new Error('Missing environment variable AIRTABLE_API_KEY');
}

console.log('hello world');