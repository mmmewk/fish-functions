
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { runInteractive } = require('./interactive-script-exec');
const colors = require('colors');
const prompts = require('prompts');

async function run () {
  const { stdout: revParse } = await exec('git rev-parse --abbrev-ref HEAD');
  const { stdout: pwd } = await exec('pwd');
  const { stdout: changedFiles } = await exec('git diff --name-status master');
  const currentBranch = revParse.trim();
  const currentDirectory = pwd.trim();
  const earliestDBMigration = changedFiles.split(/\n/)
                                          .map(file => file.replace(/^[A|M]\t/, ''))
                                          .filter(file => file.match(/^db\/migrate\//))
                                          .map(file => file.match(/^db\/migrate\/(\d*)/)[1])
                                          .sort((a, b) => parseInt(a) - parseInt(b))[0];

  if (currentDirectory !== '/Users/matthewkoppe/dev/lease-backend') {
    await process.stdout.write(colors.red('You must be in "~/dev/lease-backend" to clone the database'));
    return;
  }

  // Extra prompt to select staging database rather than production
  // unnessary right now so ehh
  // const database = await selectDatabase();
  const database = 'lease-production';
  if (!database) return;

  const runInDocker = 'docker-compose run --rm web';
  const isMaster = currentBranch === 'master';

  let checkoutMaster = 'git checkout master';
  let returnToBranch = `git checkout ${currentBranch}`
  if (earliestDBMigration) checkoutMaster = `${runInDocker} bundle exec rails db:rollback VERSION=${earliestDBMigration};git checkout db/structure.sql;${checkoutMaster}`;
  if (earliestDBMigration) returnToBranch += `;${runInDocker} rails db:migrate`;

  const commands = [
    { title: 'Checkout Master and Migrate database', value: checkoutMaster, disabled: isMaster, selected: !isMaster },
    { title: 'Take snapshot of database', value: `heroku pg:backups:capture -a ${database}`, selected: true },
    { title: 'Download Snapshot', value: `rm latest.dump;heroku pg:backups:download -a ${database}`, selected: true },
    { title: 'Stop docker web container', value: 'docker-compose stop web', selected: true },
    { title: 'Drop and recreate local database', value: `${runInDocker} bundle exec rails db:drop db:create db:structure:load`, selected: true },
    { title: 'Restore database from snapshot', value: `${runInDocker} pg_restore --verbose --clean --no-acl --no-owner -h db --dbname=postgresql://postgres:@db:5432/lease-backend_development latest.dump`, selected: true },
    { title: 'Sanitize Data', value: `${runInDocker} bundle exec rails sanitize_db:all; rm -rf storage`, selected: true },
    { title: 'Return to Branch and Migrate database', value: returnToBranch, disabled: isMaster, selected: !isMaster },
    { title: 'Restart Docker Web Container', value: 'docker-compose start web', selected: true },
  ];

  const exitCode = await runInteractive(commands, { warn: "- Already on Master" });

  process.exit(exitCode);
}

async function selectDatabase() {
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
  });

  return database;
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)