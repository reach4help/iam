/**
 * Module that encapsulates the data we will be retreiving from the database,
 * and methods to retreive it
 */
import Airtable from 'airtable';

/**
 * The database data that we get from airtable to calculate access
 */
export interface DatabaseData {

}

interface PersonFields {
  [id: string]: undefined | string | string[];
  'Slack Handle': string;
  'Leading Teams': string[];
  Teams: string[];
  'GitHub Handle': string;
  'Other Roles': string[];
  'Email Address': string;
}

interface TeamFields {
  [id: string]: undefined | string | string[];
  'Name': string;
  'Leads': string[];
  'Members': string[];
  'Slack Channel': string;
}

interface RoleFields {
  [id: string]: undefined | string | string[] | boolean;
  'Name': string;
  'People': string[];
  'Core Management Role?': boolean;
}

function getAllRows<TFields extends Airtable.FieldSet>(
  table: Airtable.Table<TFields>,
  opts?: Airtable.SelectOptions): Promise<Map<string, Airtable.Record<TFields>>> {
  const records = new Map<string, Airtable.Record<TFields>>();
  let page = 0;
  console.log(`fetching page ${page}`);
  return table.select(opts).eachPage(
    (newRecords, fetchNextPage) => {
      for (const record of newRecords) {
        records.set(record.id, record);
      }
      fetchNextPage();
      page++;
      console.log(`fetching page ${page}`);
    }
  ).then(() => records);
}

export const getData = async (): Promise<DatabaseData> => {

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;

  if (!AIRTABLE_API_KEY) {
    console.error(new Error('Missing environment variable AIRTABLE_API_KEY'));
    process.exit(1);
  }

  if (!AIRTABLE_BASE) {
    console.error(new Error('Missing environment variable AIRTABLE_BASE'));
    process.exit(1);
  }

  const airtable = new Airtable();
  const base = airtable.base(AIRTABLE_BASE);
  const people: Airtable.Table<PersonFields> = base('People') as any;
  const teams: Airtable.Table<TeamFields> = base('Teams') as any;
  const roles: Airtable.Table<RoleFields> = base('Roles') as any;


  const allPeople = await getAllRows(people);
  const allTeams = await getAllRows(teams);
  const allRoles = await getAllRows(roles);
  console.log(allTeams);
  console.log(allRoles);

  return {};
}
