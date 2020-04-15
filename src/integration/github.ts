import { Access } from '../access';
import { Octokit } from '@octokit/rest';

/**
 * Commit the current access permissions to github
 */
export const commitGithubAccess = async(access: Access) => {

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    console.error(new Error('Missing environment variable GITHUB_TOKEN'));
    process.exit(1);
  }

  const octokit = new Octokit({
    auth: GITHUB_TOKEN
  });

  for(const org of Object.keys(access.github)) {
    console.log(`Committing access for GitHub org ${org}`);
    const orgAccess = access.github[org];

    /**
     * Map from team slug to current list of members
     */
    const currentTeams = new Map<string, Set<string>>();

    const teams = await octokit.teams.list({
      org,
      per_page: 100
    });

    for (const team of teams.data) {
      console.log(`Getting members for team: ${team.name}`);
      // TODO: support getting all pages
      const membership = await octokit.teams.listMembersInOrg({
        org,
        team_slug: team.slug,
        per_page: 100
      });
      currentTeams.set(team.slug, new Set(membership.data.map(user => user.login)));
    }

    // Compare access to current teams to work out what changes to make
    const grantAccess: Array<{ teamSlug: string; username: string; }> = [];
    const revokeAccess: Array<{ teamSlug: string; username: string; }> = [];
    const missingTeams: string[] = [];
    const unexpectedTeams: string[] = [];

    for (const teamSlug of Object.keys(orgAccess.teams)) {
      const currentTeam = currentTeams.get(teamSlug);
      if (currentTeam) {
        const newTeam = new Set(orgAccess.teams[teamSlug]);
        for (const username of currentTeam) {
          if (!newTeam.has(username)) {
            revokeAccess.push({ teamSlug, username });
          }
        }
        for (const username of newTeam) {
          if (!currentTeam.has(username)) {
            grantAccess.push({ teamSlug, username });
          }
        }
      } else {
        missingTeams.push(teamSlug);
      }

    }

    for (const teamSlug of currentTeams.keys()) {
      if (!orgAccess.teams[teamSlug]) {
        unexpectedTeams.push(teamSlug);
      }
    }

    // Grant access to new team members
    for (const {teamSlug, username} of grantAccess) {
      console.log(`Granting access to ${teamSlug} for ${username}`);
      await octokit.teams.addOrUpdateMembershipInOrg({
        org,
        team_slug: teamSlug,
        username,
        role: 'maintainer',
      });
    }

    for (const { teamSlug, username } of revokeAccess) {
      console.log(`Revoking access to ${teamSlug} for ${username}`);
      await octokit.teams.removeMembershipInOrg({
        org,
        team_slug: teamSlug,
        username
      });
    }

    console.log(missingTeams);
    console.log(unexpectedTeams);

    if (missingTeams.length > 0) {
      console.error('ERROR: MISSING TEAMS:' + missingTeams.join(', '));
    }

    if (unexpectedTeams.length > 0) {
      console.error('ERROR: UNEXPECTED TEAMS:' + missingTeams.join(', '));
    }

    if (missingTeams.length > 0 || unexpectedTeams.length > 0) {
      process.exit(1);
    } else {
      console.log(`Successfully committed changes for org: ${org}`);
    }
  }

}
