
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')
const logSymbols = require('log-symbols');

async function run () {
  const { stdout: branches } = await exec('git branch -v --sort=-committerdate')

  const protectedBranches = ['master'];

  const choices = branches
    .split(/\n/)
    .filter(branch => !!branch.trim())
    .map(branch => {
      let [, flag, value, hint] = branch.match(/([* ]) +([^ ]+) +(.+)/)
      return { value, hint, disabled: flag === '*' || protectedBranches.includes(value) }
    })

  const { toDelete } = await prompts({
    type: 'multiselect',
    name: 'toDelete',
    message: 'Select branches to mark for deletion',
    choices,
    instructions: false,
    warn: "- Branch is Protected -",
  });

  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: `Warning this will delete the following branches do you want to continue: \n${toDelete.join('\n')}`,
  });

  if (!confirmed) return 1;

  await deleteBranches(toDelete)
}

async function deleteBranches (branches) {
  if (!branches) return
  await branches.map(async (branch) => {
    const { stdout, stderr } = await exec(`git branch -D ${branch}`)
    console.info(`${logSymbols.success} ${stdout}`)
    if (stderr) console.error(`${logSymbols.error} ${stderr}`)
  })
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)