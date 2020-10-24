
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')

async function run () {
  const { stdout: branches } = await exec('git branch -v --sort=-committerdate')

  const choices = branches
    .split(/\n/)
    .filter(branch => !!branch.trim())
    .map(branch => {
      const [, flag, value, hint] = branch.match(/([* ]) +([^ ]+) +(.+)/)
      return { value, hint, disabled: flag === '*' || value === 'master' }
    })

  const { toDelete } = await prompts({
    type: 'multiselect',
    name: 'toDelete',
    message: 'Delete branches',
    choices,
    hint: '- Space to select. Return to submit',
  });

  await deleteBranches(toDelete)
}

async function deleteBranches (branches) {
  if (!branches) return
  await branches.map(async (branch) => {
    const { stdout, stderr } = await exec(`git branch -D ${branch}`)
    process.stdout.write(stdout)
    process.stderr.write(stderr)
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