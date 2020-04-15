import { DatabaseData } from '../database';

const IAM_ADMIN_ROLE = 'recKtqyWh7bsEElpE';
const EVERYONE_GITHUB_TEAM = 'everyone';

export interface Access {
  github: {
    reach4help: {
      owners: string[];
      members: string[];
      teams: {
        [id: string]: string[];
      }
    }
  }
}

export const calculateAccess = (data: DatabaseData): Access => {

  // GitHub Access

  const githubOrgOwners = new Set<string>();
  const githubOrgMembers = new Set<string>();
  const githubOrgTeams: {
    [id: string]: string[];
  } = {};

  {

    const admins = data.roles[IAM_ADMIN_ROLE];
    for(const personId of admins.people) {
      const person = data.people[personId];
      if (person.githubHandle)
        githubOrgOwners.add(person.githubHandle);
    }

    for (const teamId of Object.keys(data.teams)) {
      const team = data.teams[teamId];
      console.log(team);
      const members: string[] = [];
      for (const personId of [...team.members, ...team.leads]) {
        const person = data.people[personId];
        if (person.githubHandle) {
          githubOrgMembers.add(person.githubHandle);
          members.push(person.githubHandle);
        }
      }
      if (team.gitHubTeam)
        githubOrgTeams[team.gitHubTeam] = members;
    }

    githubOrgTeams[EVERYONE_GITHUB_TEAM] = Array.from(githubOrgMembers);

  }

  const access: Access = {
    github: {
      reach4help: {
        owners: Array.from(githubOrgOwners),
        members: Array.from(githubOrgMembers),
        teams: githubOrgTeams
      }
    }
  };

  return access;
}