const { runInteractive, getChangedFiles, verifyDirectory, onError } = require('./utils');

async function run () {
  if (!verifyDirectory('/Users/matthewkoppe/dev/listings-frontend', { silent: true })) process.exit(0);

  const typescriptFiles = await getChangedFiles({ extensions: ['ts','tsx'] });
  const shouldRunTests = typescriptFiles.length !== 0;

  const commands = [
    { title: 'Jest', value: `yarn test`, disabled: !shouldRunTests, selected: shouldRunTests },
    { title: 'Eslint', value: `eslint ${typescriptFiles.join(' ')}`, disabled: !shouldRunTests, selected: shouldRunTests },
  ]

  if (!shouldRunTests) process.exit(0);

  const exitCode = await runInteractive(commands, { prompt: 'Which features would you like to test?', warn: '- No Files to test.' });

  process.exit(exitCode)
}

run().catch(onError)