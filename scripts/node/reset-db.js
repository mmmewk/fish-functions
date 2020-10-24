
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logSymbols = require('log-symbols');
const ora = require('ora');
const prompts = require('prompts');
const red = `tput setaf 1`;
const green = `tput setaf 2`;
const blue = `tput setaf 4`;
const normal = `tput setaf 7`;
const spinnerColors = ['yellow', 'blue', 'magenta', 'cyan'];
const sample = require('lodash/sample');

async function run () {
  const { stdout: currentBranch } = await exec('git current');
  const { stdout: currentDirectory } = await exec('pwd');

  if (currentDirectory.trim() !== '/Users/matthewkoppe/dev/lease-backend') {
    await execCommand(`echo $(${red}) You must be in "~/dev/lease-backend" to clone the database $(${normal})`);
    return;
  }


  const databases = [
    { title: 'Production', value: 'lease-production', hint: 'lease-production' },
    { title: 'Staging', value: 'lease-staging', hint: 'lease-staging' },
  ];

  const { database } = await prompts({
    type: 'select',
    name: 'database',
    message: 'Which database would you like to clone?',
    choices: databases,
    hint: databases[0].hint,
    onState ({ value }) {
      this.hint = databases.find(c => c.value === value).hint;
    }
  })

  // exit if prompt exited with ctl+c
  if (!database) return;

  const runInDocker = 'docker-compose run --rm web';

  const choices = [
    { title: 'Checkout Master', value: 'git checkout master', disabled: currentBranch.trim() === 'master' },
    { title: 'Take snapshot of database', value: `heroku pg:backups:capture -a ${database}` },
    { title: 'Copy database to local', value: `rm latest.dump;heroku pg:backups:download -a ${database}` },
    { title: 'Drop database', value: `${runInDocker} bundle exec rake db:drop db:create db:structure:load` },
    { title: 'Restore database', value: `${runInDocker} pg_restore --verbose --clean --no-acl --no-owner -h db --dbname=postgresql://postgres:@db:5432/lease-backend_development latest.dump; rm -rf storage`},
    { title: 'Sanitize Database', value: `${runInDocker} bundle exec rake sanitize_db:all` },
    { title: 'Return to Branch', value: `git checkout ${currentBranch}`, disabled: currentBranch.trim() === 'master' },
    { title: 'Migrate Database', value: `${runInDocker} rails db:migrate` },
  ];

  const { steps } = await prompts({
    type: 'multiselect',
    name: 'steps',
    message: 'Choose Actions you would like to take',
    choices,
    warn: "- Already on Master",
  });

  // exit if prompt exited with ctl+c
  if (!steps) return;
  let success = true;

  while (steps.length > 0 && success) {
    step = steps.shift();
    success = await (tryStep(step));
  }

}

async function tryStep(step) {
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

}

async function execCommand(command) {
  if (!command) return
  const { stdout, stderr } = await exec(command)
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