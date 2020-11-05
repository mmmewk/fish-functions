
const { runInteractive, scriptError, promptSelect } = require('matts-dev-tools/utils');
const { diffMigrations } = require('matts-dev-tools/rails');

async function run () {
  process.chdir('/Users/matthewkoppe/dev/lease-backend');
  const { current: shouldMigrate } = await diffMigrations('master');

  const databases = [
    { title: 'Production', value: 'lease-production' },
    { title: 'Staging', value: 'lease-staging' },
  ];

  const database = await promptSelect('Which database would you like to clone?', databases);
  if (!database) return;

  const commands = [
    { title: 'Take snapshot of database', value: `heroku pg:backups:capture -a ${database}`, selected: true },
    { title: 'Download Snapshot', value: `rm latest.dump;heroku pg:backups:download -a ${database}`, selected: true },
    { title: 'Stop docker web container', value: 'docker-compose stop web', selected: true },
    { title: 'Checkout DB structure from origin/master', value: 'git checkout origin/master -- db/structure.sql', selected: true, },
    { title: 'Drop and recreate local database', value: 'rails db:drop db:create db:structure:load', selected: true, docker: true, bundler: true },
    { title: 'Restore database from snapshot', value: 'pg_restore --verbose --clean --no-acl --no-owner -h db --dbname=postgresql://postgres:@db:5432/lease-backend_development latest.dump', docker: true, selected: true },
    { title: 'Sanitize Data', value: 'rails sanitize_db:all; rm -rf storage', docker: true, bundler: true, selected: true },
    { title: 'Restart Docker Web Container', value: 'docker-compose start web', selected: true },
    { title: 'Migrate Database', value: 'rails db:migrate', docker: true, bundler: true, selected: Boolean(shouldMigrate) },
  ];

  const exitCode = await runInteractive(commands, { warn: "- Already on Master" });

  process.exit(exitCode);
}

run().catch(scriptError)