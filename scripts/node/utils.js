
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logSymbols = require('log-symbols');
const ora = require('ora');
const prompts = require('prompts');
const spinnerColors = ['yellow',
'blue', 'magenta', 'cyan'];
const sample = require('lodash/sample');
const takeRight = require('lodash/takeRight');
const replace = require('lodash/replace');
const colors = require('colors');
const temp = require('temp');

// Automatically track and cleanup files at exit
temp.track();

function log(msg) {
  if (process.env.NODE_ENV !== 'test') console.log(msg);
}

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

async function execCommand(command, options = {}) {
  if (options.context) log(`${colors.yellow(options.context)}`);
  log(`${colors.blue(command)}`);
  const spinner = ora().start();
  spinner.color = sample(spinnerColors);
  spinner.text = `Time Elapsed: ${0}s\n`;
  let clock = 0;

  setInterval(() => {
    clock += 1;
    spinner.text = `Time Elapsed: ${clock}s\n`;
  }, 1000);

  try {
    await exec(inContext(command, options), options);

    spinner.stopAndPersist({ symbol: logSymbols.success, color: 'green' });
    return 0;
  } catch(e) {
    const reportLength = options.reportLength || 100;
    spinner.stopAndPersist({ symbol: logSymbols.error, color: 'red' });
    log(`\n Last ${reportLength} lines of stdout: \n`);
    if (e.stdout || e.stderr) {
      log(takeRight((e.stdout || e.stderr).split("\n"), reportLength).join("\n"));
    } else {
      log(e);
    }
    return 1;
  }
}

async function getCurrentBranch(options = {}) {
  const { stdout: currentBranch } = await exec('git rev-parse --abbrev-ref HEAD', options);
  return currentBranch.trim();
}

async function getBranches(options = {}) {
  const { stdout: branchString } = await exec('git branch -v --sort=-committerdate', options);
  let branches = branchString.split(/\n/).map(branch => branch.trim()).filter(branch => !!branch);
  if (options.nameOnly) branches = branches.map(branch => replace(branch, /^\*\s*/, '').split(' ')[0]);
  return branches;
}

async function getCurrentDirectory(options) {
  const { stdout: currentDirectory } = await exec('pwd', options);
  return currentDirectory.trim();
}

async function getChangedFiles({ extensions = ['\w*'], types = ['A','M','R','T', 'U'], branch = 'master' } = {}) {
  let { stdout: untractedFiles } = await exec('git ls-files --others --exclude-standard');
  untractedFiles = untractedFiles.split(/\n/).filter(file => !!file.trim()).map(file => `A\t${file}`).join('\n');
  let { stdout: changedFiles } = await exec(`git diff --name-status ${branch}`);
  if (types.includes('A')) changedFiles = `${changedFiles}${untractedFiles}`;
  return changedFiles.split(/\n/)
                     .filter(file => file.match(new RegExp(`^[${types.join('|')}]`)))
                     .filter(file => file.match(new RegExp(`\.(${extensions.join('|')})$`)))
                     .map(file => file.replace(new RegExp(`^[${types.join('|')}]\s*\\t`), ''))
                     .map(file => file.trim())
                     .filter(file => !!file)
}

async function getMigrations(branch = 'master') {
  const backMigrationFiles = await getChangedFiles({ extensions: ['.rb'], types: ['A'], branch });
  const forwardMigrationFiles = await getChangedFiles({ extensions: ['.rb'], types: ['D'], branch });
  return { back: getMigrationVersion(backMigrationFiles), forward: getMigrationVersion(forwardMigrationFiles) };
}

function getMigrationVersion(migrationFiles) {
  return migrationFiles.filter(file => file.match(/^db\/migrate\//))
                       .map(file => file.match(/^db\/migrate\/(\d*)/)[1])
                       .sort((a, b) => parseInt(a) - parseInt(b))[0];
}

async function verifyDirectory(directory, options = { silent: false }) {
  const currentDirectory = await getCurrentDirectory();
  if (currentDirectory !== directory) {
    if (!options.silent) log(colors.red(`You must be in ${directory} to clone the database`));
    return false;
  }
  return true;
}

async function prompt(message) {
  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message,
  });
  return confirmed;
}

async function promptSelect(message, choices, options) {
  const transformedChoices = choices.map((choice) => {
    if (typeof choice === 'string') return { title: choice, hint: choice, value: choice };

    if (!choice.hint) choice.hint = choice.value;
    if (!choice.title) choice.title = choice.value;
    return choice;
  })

  const { selected } = await prompts({
    type: 'select',
    name: 'selected',
    message,
    choices: transformedChoices,
    hint: transformedChoices[0].hint,
    onState ({ value }) {
      this.hint = transformedChoices.find(c => c.value === value).hint
    },
    ...options,
  });

  return selected;
}

async function migrateDown(version, options = { bundler: true }) {
  await execCommand(`rails db:rollback VERSION=${version}`, { context: 'Migrate Down', ...options });
}

async function migrateUp(options = { bundler: true }) {
  await execCommand('rails db:migrate', { context: 'Migrate Up', ...options });
}

async function checkout(branch, options = {}) {
  if (!branch) return;
  if (options.stash) await execCommand('git stash');
  const success = await execCommand(`git checkout ${branch}`, { context: `Checkout ${branch}`, ...options });
  if (options.stash) await execCommand('git stash apply');
  return success;
}

const inDocker = 'docker-compose run --rm web';
const withBundle = 'bundle exec';

function inContext(command, { bundler = false, docker = false } = {}) {
  if (bundler) command = `${withBundle} ${command}`;
  if (docker) command = `${inDocker} ${command}`;
}

async function sleep(ms) {
  await new Promise((resolve, _reject) => { setTimeout(() => resolve(), ms) });
}

function onError (e) {
  if (e.stderr) {
    log(e.stderr)
  } else {
    log(e)
  }
}

module.exports = {
  runInteractive,
  execCommand,
  prompt,
  promptSelect,
  inContext,
  verifyDirectory,
  getChangedFiles,
  getCurrentBranch,
  getBranches,
  getCurrentDirectory,
  getMigrations,
  onError,
  migrateUp,
  migrateDown,
  checkout,
};