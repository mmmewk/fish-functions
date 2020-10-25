
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logSymbols = require('log-symbols');
const ora = require('ora');
const prompts = require('prompts');
const spinnerColors = ['yellow', 'blue', 'magenta', 'cyan'];
const sample = require('lodash/sample');
const colors = require('colors');

async function runInteractive(commands, options = {}) {
  const { steps } = await prompts({
    type: 'multiselect',
    name: 'steps',
    instructions: false,
    message: options.prompt || 'Choose Actions you would like to take',
    choices: commands,
    ...options,
  });

  // exit if prompt exited with ctl+c
  if (!steps) return;
  let success = true;

  while (steps.length > 0 && success) {
    step = steps.shift();
    title = commands.find(command => command.value === step).title
    success = await (tryCommand(step, { context: title }));
  }
  return success;
};

async function tryCommand(step, options) {
  if (options.context) process.stdout.write(`${colors.blue(options.context)}\n`)
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