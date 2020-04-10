/**
 * Module that encapsulates the data we will be retreiving from the database,
 * and methods to retreive it
 */
import Airtable from 'airtable';

/**
 * The database data that we get from airtable to calculate access
 */
export interface DatabaseData {
  teams: {
    [id: string]: {
      name: string;
      slackChannel?: string;
      googleGroup?: string;
      gitHubTeam?: string;
      leads: string[];
      members: string[];
    }
  };
  roles: {
    [id: string]: {
      name: string;
      slackChannel?: string;
      googleGroup?: string;
      gitHubTeam?: string;
      people: string[];
    }
  };
  people: {
    [id: string]: {
      slackHandle: string;
      /**
       * Only defined if the user has a GitHub handle
       */
      githubHandle?: string;
      /**
       * Only defined if they need to have access to 1 or more google groups
       */
      emailAddress?: string;
      /**
       * Only defined if they have an official @reach4help.org account
       */
      officialHandle?: string;
    }
  }
}

interface PersonFields {
  [id: string]: undefined | string | string[];
  'Slack Handle'?: string;
  'Leading Teams'?: string[];
  Teams?: string[];
  'GitHub Handle'?: string;
  'Other Roles'?: string[];
  'Email Address'?: string;
  'Official Handle'?: string;
}

interface TeamFields {
  [id: string]: undefined | string | string[];
  'Name'?: string;
  'Leads'?: string[];
  'Members'?: string[];
  'Slack Channel'?: string;
  'Google Group'?: string;
  'GitHub Team'?: string;
}

interface RoleFields {
  [id: string]: undefined | string | string[] | boolean;
  'Name'?: string;
  'People'?: string[];
  'Slack Channel'?: string;
  'Google Group'?: string;
  'GitHub Team'?: string;
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

  const data: DatabaseData = {
    teams: {},
    roles: {},
    people: {},
  }

  /**
   * People that are a member of one or more teams or have one or more roles
   */
  const requiredPeople = new Set<string>();

  for (const role of (await getAllRows(roles)).values()) {
    if (role.fields.Name){
      data.roles[role.id] = {
        name: role.fields.Name,
        people: role.fields.People || [],
        gitHubTeam: role.fields["GitHub Team"] || undefined,
        googleGroup: role.fields["Google Group"] || undefined,
        slackChannel: role.fields["Slack Channel"] || undefined,
      }
      for (const person of data.roles[role.id].people) {
        requiredPeople.add(person);
      }
    }
  }

  for (const team of (await getAllRows(teams)).values()) {
    if (team.fields.Name) {
      data.teams[team.id] = {
        name: team.fields.Name,
        leads: team.fields.Leads || [],
        members: team.fields.Members || [],
        gitHubTeam: team.fields["GitHub Team"] || undefined,
        googleGroup: team.fields["Google Group"] || undefined,
        slackChannel: team.fields["Slack Channel"] || undefined,
      }
      for (const person of data.teams[team.id].leads) {
        requiredPeople.add(person);
      }
      for (const person of data.teams[team.id].members) {
        requiredPeople.add(person);
      }
    }
  }

  for (const person of (await getAllRows(people)).values()) {
    if (requiredPeople.has(person.id) && person.fields["Slack Handle"]) {
      let requiresEmail = false;
      for(const team of person.fields.Teams || []) {
        requiresEmail = data.teams[team]?.googleGroup ? true : requiresEmail;
      }
      for (const team of person.fields["Leading Teams"] || []) {
        requiresEmail = data.teams[team]?.googleGroup ? true : requiresEmail;
      }
      for (const role of person.fields["Other Roles"] || []) {
        requiresEmail = data.roles[role]?.googleGroup ? true : requiresEmail;
      }
      data.people[person.id] = {
        slackHandle: person.fields["Slack Handle"],
        githubHandle: person.fields["GitHub Handle"] || undefined,
        emailAddress: requiresEmail ? person.fields["Email Address"] : undefined,
        officialHandle: person.fields["Official Handle"] || undefined,
      }
    }
  }

  console.log(data);
  return data;
}
