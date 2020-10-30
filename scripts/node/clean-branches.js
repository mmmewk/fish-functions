const prompts = require('prompts');
const { getBranches, execCommand, prompt } = require ('./utils');

async function run () {
  const protectedBranches = ['master'];

  const branches = await getBranches();
  const choices = branches.map(branch => {
    let [, flag, value, hint] = branch.match(/([* ])?\s*([\w-_/\\]+) +(.+)/)
    return { value, hint, disabled: flag === '*' || protectedBranches.includes(value) }
  });

  const { toDelete } = await prompts({
    type: 'multiselect',
    name: 'toDelete',
    message: 'Select branches to mark for deletion',
    choices,
    instructions: false,
    warn: "- Branch is Protected -",
  });

  if (!toDelete) process.exit(1);

  const confirmed = await prompt(`Warning this will delete the following branches do you want to continue: \n${toDelete.join('\n')}\n`);

  if (!confirmed) process.exit(1);

  await deleteBranches(toDelete)

  process.exit(0);
}

async function deleteBranches (branches) {
  if (!branches) return
  while (branches.length > 0) await execCommand(`git branch -D ${branches.pop()}`);
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)