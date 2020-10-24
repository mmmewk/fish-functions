
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logSymbols = require('log-symbols');
const ora = require('ora');
const prompts = require('prompts');
const spinnerColors = ['yellow', 'blue', 'magenta', 'cyan'];
const sample = require('lodash/sample');

async function runInteractive(commands, options = {}) {
  const { steps } = await prompts({
    type: 'multiselect',
    name: 'steps',
    message: 'Choose Actions you would like to take',
    choices: commands,
    ...options,
  });

  // exit if prompt exited with ctl+c
  if (!steps) return;
  let success = true;

  while (steps.length > 0 && success) {
    step = steps.shift();
    success = await (tryCommand(step));
  }
};

async function tryCommand(step) {
  const spinner = ora().start();
  spinner.color = sample(spinnerColors);
  spinner.text = step;
  try {
    await exec(step);
    spinner.stopAndPersist({ symbol: logSymbols.success, color: 'green' });
    return true;
  } catch(e) {
    spinner.stopAndPersist({ symbol: logSymbols.error, color: 'red' });
    return false;
  }
};

module.exports = { tryCommand, runInteractive };