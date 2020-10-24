
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')
const red = `tput setaf 1`;
const green = `tput setaf 2`;
const blue = `tput setaf 4`;
const normal = `tput setaf 7`;

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

  // dr bundle exec rake db:drop db:create db:structure:load
  // dr pg_restore --verbose --clean --no-acl --no-owner -h db --dbname=postgresql://postgres:@db:5432/lease-backend_development latest.dump
  // rm latest.dump
  // rm -rf storage
  // dr bundle exec rake sanitize_db:all
  // back

  const choices = [
    { title: 'Checkout Master', value: 'git checkout master', disabled: currentBranch.trim() === 'master', hint: 'git checkout master' },
    { title: 'Take snapshot of database', value: `heroku pg:backups:capture -a ${database}`, hint: `heroku pg:backups:capture -a ${database}` },
    { title: 'Copy database to local', value: `rm latest.dump;heroku pg:backups:download -a ${database}`, hint: `heroku pg:backups:download -a ${database}` },
    { title: 'Recreate database', value: `docker-compose run --rm web bundle exec rake db:drop db:create db:structure:load`, hint: `docker-compose run --rm web bundle exec rake db:drop db:create db:structure:load` },
    { title: 'Echo why', value: `echo why`, hint: `echo why`},
  ];

  const { steps } = await prompts({
    type: 'multiselect',
    name: 'steps',
    message: 'Choose Actions you would like to take',
    choices,
    hint: choices[0].hint,
    onState ({ value }) {
      const choice = choices.find(c => c.value === value);
      if (choice) {
        this.hint = choice.hint;
      }
    }
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
  try {
    await execCommand(step);
    await execCommand(`echo $(${green})${step} successful.$(${normal})`)
    return true;
  } catch(e) {
    // If one command fails break out
    await execCommand(`echo $(${red})${step} failed.$(${normal})`)
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