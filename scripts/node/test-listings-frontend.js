
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { runInteractive } = require('./interactive-script-exec');
const fs = require('fs')

async function run () {
  const { stdout: currentDirectory } = await exec('pwd');

  if (currentDirectory.trim() !== '/Users/matthewkoppe/dev/listings-frontend') {
    process.exit(0);
  }

  const { stdout: fileString } = await exec('git diff --name-status master');
  const typescriptFiles = fileString.split(/\n/)
                          .map(file => file.replace(/^[AM]\s*/, ''))
                          .filter(file => !!file.trim())
                          .filter(file => file.match(/\.(ts|tsx)$/));

  const shouldRunTests = typescriptFiles.length !== 0;

  const commands = [
    { title: 'Jest', value: `yarn test`, disabled: !shouldRunTests, selected: shouldRunTests },
    { title: 'Eslint', value: `eslint ${typescriptFiles.join(' ')}`, disabled: !shouldRunTests, selected: shouldRunTests },
  ]

  if (!shouldRunTests) process.exit(0);

  const exitCode = await runInteractive(commands, { prompt: 'Which features would you like to test?', warn: '- No Files to test.' });

  process.exit(exitCode)
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)