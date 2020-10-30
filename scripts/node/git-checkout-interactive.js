#!/usr/bin/env node

const colors = require('colors'); 

const {
  promptSelect,
  getBranches,
  getCurrentDirectory,
  migrateDown,
  migrateUp,
  checkout,
  onError,
  getMigrations,
  execCommand,
} = require('./utils');

async function run () {
  const branches = await getBranches();
  if (branches.length === 1) {
    console.log(colors.yellow('Only one branch exists'));
    process.exit(0);
  }
  const choices = branches.map((branch) => {
    const [, flag, value, hint] = branch.match(/(\*)?\s*([\w-_/\\]+) +(.+)/)
    return { value, hint, disabled: flag === '*' }
  });

  const branch = await promptSelect('Switch Branch', choices, { warn: 'current branch' });

  const currentDirectory = await getCurrentDirectory();
  const { back, forward } = await getMigrations(branch);
  
  if (currentDirectory === '/Users/matthewkoppe/dev/lease-backend' && back) {
    await migrateDown(back, { docker: true, bundler: true });
    await execCommand('git checkout db/structure.sql');
  }

  await checkout(branch)

  if (currentDirectory === '/Users/matthewkoppe/dev/lease-backend' && forward) await migrateUp({ docker: true, bundler: true });

  process.exit(0);
}

run().catch(onError)