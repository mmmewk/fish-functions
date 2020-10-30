
const { runInteractive, getCurrentBranch, getMigrations, onError, promptSelect, inContext } = require('./utils');

async function run () {
  process.chdir('/Users/matthewkoppe/dev/lease-backend');
  const currentBranch = await getCurrentBranch();
  const { back } = await getMigrations();

  const databases = [
    { title: 'Production', value: 'lease-production' },
    { title: 'Staging', value: 'lease-staging' },
  ];
  const database = await promptSelect('Which database would you like to clone?', databases);
  if (!database) return;

  const isMaster = currentBranch === 'master';

  let checkoutMaster = 'git checkout master';
  let returnToBranch = `git checkout ${currentBranch}`
  if (migration) checkoutMaster = `rails db:rollback VERSION=${back};git checkout db/structure.sql;${checkoutMaster}`;
  if (migration) returnToBranch += inContext('rails db:migrate', { docker: true, bundler: true });

  const commands = [
    { title: 'Checkout Master and Migrate database', value: checkoutMaster, disabled: isMaster, selected: !isMaster, docker: true, bundler: true },
    { title: 'Take snapshot of database', value: `heroku pg:backups:capture -a ${database}`, selected: true },
    { title: 'Download Snapshot', value: `rm latest.dump;heroku pg:backups:download -a ${database}`, selected: true },
    { title: 'Stop docker web container', value: 'docker-compose stop web', selected: true },
    { title: 'Drop and recreate local database', value: 'rails db:drop db:create db:structure:load', selected: true, docker: true, bundler: true },
    { title: 'Restore database from snapshot', value: 'pg_restore --verbose --clean --no-acl --no-owner -h db --dbname=postgresql://postgres:@db:5432/lease-backend_development latest.dump', docker: true, selected: true },
    { title: 'Sanitize Data', value: 'rails sanitize_db:all; rm -rf storage', docker: true, bundler: true, selected: true },
    { title: 'Return to Branch and Migrate database', value: returnToBranch, disabled: isMaster, selected: !isMaster },
    { title: 'Restart Docker Web Container', value: 'docker-compose start web', selected: true },
  ];

  const exitCode = await runInteractive(commands, { warn: "- Already on Master" });

  process.exit(exitCode);
}

run().catch(onError)