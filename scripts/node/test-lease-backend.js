
const { runInteractive, getChangedFiles, promptSelect, scriptError } = require('matts-dev-tools/utils');
const { getCurrentBranch } = require('matts-dev-tools/git');
const fs = require('fs');

async function run () {
  if (process.cwd() !== '/Users/matthewkoppe/dev/lease-backend') process.exit(0);
  const currentBranch = await getCurrentBranch();

  const testAgainst = await promptSelect('Test changes against which base?', [{ title: 'Last Commit', value: currentBranch }, { title: 'Master', value: 'origin/master' }, 'none']);

  if (testAgainst === 'none') process.exit(0);
  if (testAgainst === null) process.exit(1);


  const rubyFiles = await getChangedFiles({ extensions: ['.rb', '.rake'], branch: testAgainst });
    // TODO: some files aren't lintable check again
  const lintableFiles = rubyFiles.filter(file => file.match(/^(app|lib|spec|config)\//))

  // look for spec files by assuming the filenames match up
  let specFiles = lintableFiles.map((file) => {
    return file.replace(/^(app|lib|spec|config)\//, 'spec/')
               .replace(/controllers\/api\//, 'requests/')
               .replace(/(_spec|_controller)?\.(rb|rake)$/, '_spec.rb')
  }).filter(fs.existsSync)

  // Unique
  specFiles = specFiles.filter((file, index) => specFiles.indexOf(file) === index);
  
  const shouldLint = lintableFiles.length !== 0;
  const shouldCheckSpecs = specFiles.length !== 0;

  const commands = [
    { title: 'Rubocop Convention Level on Project', value: 'rubocop --fail-level=convention --display-only-fail-level-offenses -a', disabled: !shouldLint, selected: shouldLint, bundler: true, docker: false },
    { title: 'Rubocop Refactor Level on changed files', value: `rubocop ${lintableFiles.join(' ')}`, disabled: !shouldLint, selected: false, bundler: true, docker: false },
    { title: 'Update Sorbet Generated Files', value: './sorbet/rbi-update.sh', docker: true, selected: false },
    { title: 'Sorbet', value: 'srb tc', disabled: !shouldLint, selected: shouldLint, bundler: true },
    { title: 'RSpec', value: `bin/rspec --fail-fast ${specFiles.join(' ')}`, disabled: !shouldCheckSpecs, selected: shouldCheckSpecs, docker: true, bundler: true },
  ]

  if (!shouldLint && !shouldCheckSpecs) process.exit(0);

  const exitCode = await runInteractive(commands, { prompt: 'Which features would you like to test?', warn: '- No Files to test.' });

  process.exit(exitCode)
}

run().catch(scriptError)
