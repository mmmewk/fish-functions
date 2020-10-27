
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logSymbols = require('log-symbols');
const ora = require('ora');
const prompts = require('prompts');
const spinnerColors = ['yellow', 'blue', 'magenta', 'cyan'];
const sample = require('lodash/sample');
const takeRight = require('lodash/takeRight');
const colors = require('colors');
const temp = require('temp');

// Automatically track and cleanup files at exit
temp.track();

async function runInteractive(commands, options = {}) {
  const { steps } = await prompts({
    type: 'multiselect',
    name: 'steps',
    instructions: false,
    message: options.prompt || 'Choose Actions you would like to take',
    choices: commands,
    ...options,
  });

  if (!steps) return;
  const exitCodes = []

  while (steps.length > 0 && exitCodes.every(code => code === 0)) {
    step = steps.shift();
    commandInfo = commands.find(command => command.value === step);
    const exitCode = await execCommand(step, {
      context: commandInfo.title,
      ...commandInfo,
    });
    exitCodes.push(exitCode);
  }
  return exitCodes.pop();
};

async function execCommand(command, options) {
  if (options.context) console.info(`${colors.yellow(options.context)}`);
  console.info(`${colors.blue(step)}`);
  const spinner = ora().start();
  spinner.color = sample(spinnerColors);
  spinner.text = `Time Elapsed: ${0}s\n`;
  let clock = 0;

  setInterval(() => {
    clock += 1;
    spinner.text = `Time Elapsed: ${clock}s\n`;
  }, 1000);

  try {
    await exec(command);

    spinner.stopAndPersist({ symbol: logSymbols.success, color: 'green' });
    return 0;
  } catch(e) {
    const reportLength = options.reportLength || 100;
    spinner.stopAndPersist({ symbol: logSymbols.error, color: 'red' });
    console.error(`\n Last ${reportLength} lines of stdout: \n`);
    console.error(takeRight(e.stdout.split("\n"), reportLength).join("\n"));
    return 1;
  }
}

module.exports = { runInteractive, execCommand };