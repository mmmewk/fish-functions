
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { runInteractive } = require('./interactive-script-exec');
const colors = require('colors');

async function run () {
  const { stdout: currentBranch } = await exec('git current');
  const { stdout: currentDirectory } = await exec('pwd');

  if (currentDirectory.trim() !== '/Users/matthewkoppe/dev/lease-backend') {
    await process.stdout.write(colors.red('You must be in "~/dev/lease-backend" to clone the database'));
    return;
  }

  // const databases = [
  //   { title: 'Production', value: 'lease-production', hint: 'lease-production' },
  //   { title: 'Staging', value: 'lease-staging', hint: 'lease-staging' },
  // ];

  // const { database } = await prompts({
  //   type: 'select',
  //   name: 'database',
  //   message: 'Which database would you like to clone?',
  //   choices: databases,
  //   hint: databases[0].hint,
  //   onState ({ value }) {
  //     this.hint = databases.find(c => c.value === value).hint;
  //   }
  // })

  // exit if prompt exited with ctl+c
  // if (!database) return;

  const runInDocker = 'docker-compose run --rm web';

  const commands = [
    { title: 'Checkout Master', value: 'git checkout master', disabled: currentBranch.trim() === 'master' },
    { title: 'Take snapshot of database', value: 'heroku pg:backups:capture -a lease-production' },
    { title: 'Copy database to local', value: 'rm latest.dump;heroku pg:backups:download -a lease-production' },
    { title: 'Drop database', value: `${runInDocker} bundle exec rake db:drop db:create db:structure:load` },
    { title: 'Restore database', value: `${runInDocker} pg_restore --verbose --clean --no-acl --no-owner -h db --dbname=postgresql://postgres:@db:5432/lease-backend_development latest.dump; rm -rf storage`},
    { title: 'Sanitize Database', value: `${runInDocker} bundle exec rake sanitize_db:all` },
    { title: 'Return to Branch', value: `git checkout ${currentBranch}`, disabled: currentBranch.trim() === 'master' },
    { title: 'Migrate Database', value: `${runInDocker} rails db:migrate` },
  ];

  await runInteractive(commands, { warn: "- Already on Master" });
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)