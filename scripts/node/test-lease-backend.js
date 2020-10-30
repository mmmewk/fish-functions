
const { runInteractive, getChangedFiles, getCurrentBranch, verifyDirectory, onError } = require('./utils');
const fs = require('fs');

async function run () {
  if (!verifyDirectory('/Users/matthewkoppe/dev/lease-backend', { silent: true })) process.exit(0);
  const currentBranch = await getCurrentBranch();

  const rubyFiles = await getChangedFiles({ extensions: ['.rb', '.rake'], branch: currentBranch });
  const lintableFiles = rubyFiles.filter(file => file.match(/^(app|lib|spec|config)\//))

  const specFiles = lintableFiles.map((file) => {
    return file.replace(/^(app|lib|spec|config)\//, 'spec/')
               .replace(/controllers\/api\//, 'requests/')
               .replace(/(_spec|_controller)?\.(rb|rake)$/, '_spec.rb')
  }).filter(fs.existsSync)
  
  const shouldLint = lintableFiles.length !== 0;
  const shouldCheckSpecs = specFiles.length !== 0;

  const commands = [
    { title: 'Rubocop', value: `rubocop ${lintableFiles.join(' ')}`, disabled: !shouldLint, selected: shouldLint, bundler: true, docker: false },
    { title: 'Sorbet', value: `srb tc ${lintableFiles.join(' ')}`, disabled: !shouldLint, selected: shouldLint },
    { title: 'RSpec', value: `rspec --fail-fast ${specFiles.join(' ')}`, disabled: !shouldCheckSpecs, selected: shouldCheckSpecs, docker: true, bundler: true },
  ]

  if (!shouldLint && !shouldCheckSpecs) process.exit(0);

  const exitCode = await runInteractive(commands, { prompt: 'Which features would you like to test?', warn: '- No Files to test.' });

  process.exit(exitCode)
}

run().catch(onError)