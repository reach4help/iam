# Reach4Help Identity & Access Management

Project volunteer and team management is done via AirTable. Team leads can
onboard their own members, and subsequently request that those members are
granted neccesary access to ALL THE THINGS, which is done via this repo
in a few steps:

1. Collect relevent data from AirTable and store in `data/data.json` (only users that are )
1. Convert `data.json` into access rules and store as `data/access.json`
   * TODO: set up system to automatically run (1) and (2), and open a PR if there are any changes (or at least notify that changes need to be made).
1. Review these files changes in a Pull Request and commit
   * TODO: Protect master branch
1. Apply the access permissions in `data/access.json`
   * TODO: do automatically on master branch.

## Building the project

We use `yarn` in this project, to build the scripts, run:

```
yarn install
yarn run build
```


## Running the project

### (1) Downloading the data from AirTable

1. Get [an api key](https://airtable.com/api) from AirTable
1. Set the environment variable `AIRTABLE_API_KEY` to that key, and the variable
`AIRTABLE_BASE` to the value `appI4fhfJ4PiYqEqP`.
   To persist these values you can create the file `.env` (ignored by git) with
   the values like so:

   ```ini
   AIRTABLE_API_KEY=<your key>
   AIRTABLE_BASE=appI4fhfJ4PiYqEqP
   ```
1. Run `yarn run get-data`

### (2) Calculating access

1. Run `yarn run calculate-access`

### (4) Applying access permissions

1. Get [a personal access token](https://github.com/settings/tokens) from GitHub
1. Set the environment variable `GITHUB_TOKEN` to that token.
   To persist this value you can create the file `.env` (ignored by git) with
   the value like so:

   ```ini
   GITHUB_TOKEN=<your github token>
   ```
1. Run `yarn run apply-access`