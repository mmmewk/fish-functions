
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { runInteractive } = require('./interactive-script-exec');
const fs = require('fs')

async function run () {
  const { stdout: currentDirectory } = await exec('pwd');

  if (currentDirectory.trim() !== '/Users/matthewkoppe/dev/lease-backend') {
    process.exit(0);
  }

  const { stdout: fileString } = await exec('git ls-files -m');
  const rubyFiles = fileString.split(/\n/)
                          .filter(file => !!file.trim())
                          .filter(file => file.match(/^(app|lib|spec|config)\//))
                          .filter(file => file.match(/\.(rb|rake)$/));

  const specFiles = rubyFiles.map((file) => {
    return file.replace(/^(app|lib|spec|config)\//, 'spec/')
               .replace(/(_spec)?\.(rb|rake)$/, '_spec.rb')
               
  }).filter(fs.existsSync)
  
  const shouldCheckRuby = rubyFiles.length !== 0;
  const shouldCheckSpecs = specFiles.length !== 0;

  const commands = [
    { title: 'Rubocop', value: `bundle exec rubocop ${rubyFiles.join(' ')}`, disabled: !shouldCheckRuby, selected: shouldCheckRuby },
    { title: 'Sorbet', value: `docker-compose run --rm web srb tc ${rubyFiles.join(' ')}`, disabled: !shouldCheckRuby, selected: shouldCheckRuby },
    { title: 'RSpec', value: `docker-compose run --rm web rspec ${specFiles.join(' ')}`, disabled: !shouldCheckSpecs, selected: shouldCheckSpecs },
  ]

  if (!shouldCheckRuby && !shouldCheckSpecs) process.exit(0);

  const success = await runInteractive(commands, { prompt: 'Which features would you like to test?', warn: '- No Files to test.' });

  process.exit(success ? 0 : 1)
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)