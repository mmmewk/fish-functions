#!/usr/bin/env node

const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')

async function run () {
  const { stdout: branches } = await exec('git branch -v --sort=-committerdate')

  const choices = branches
    .split(/\n/)
    .filter(branch => !!branch.trim())
    .map(branch => {
      let [, flag, value, hint] = branch.match(/([* ]) +([^ ]+) +(.+)/)
      const ticketMatch = value.match(/([EN|en]-[\w]*)/);
      if (ticketMatch) {
        hint = `https://loftium.atlassian.net/secure/RapidBoard.jspa?rapidView=2&projectKey=EN&modal=detail&selectedIssue=${ticketMatch[1]}`;
      }
      return { value, hint, disabled: flag === '*' }
    })

  const { branch } = await prompts({
    type: 'select',
    name: 'branch',
    message: 'Switch branch',
    choices,
    hint: choices[0].hint,
    warn: 'current branch',
    onState ({ value }) {
      this.hint = choices.find(c => c.value === value).hint
    }
  })

  await checkout(branch)
}

async function checkout (branch) {
  if (!branch) return
  const { stdout, stderr } = await exec(`git checkout ${branch}`)
  process.stdout.write(stdout)
  process.stderr.write(stderr)
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)