const { runInteractive, getChangedFiles, scriptError } = require('matts-dev-tools/utils');

async function run () {
  if (process.cwd() !== '/Users/matthewkoppe/dev/frontend-monorepo') process.exit(0);

  const typescriptFiles = await getChangedFiles({ extensions: ['ts','tsx'], branch: 'main' });
  const utilsChanged = typescriptFiles.filter((file) => file.includes('frontend-utils')).length !== 0
  const mobileAppChanged = typescriptFiles.filter((file) => file.includes('mobile-app')).length !== 0;
  const webAppChanged = typescriptFiles.filter((file) => file.includes('web-app')).length !== 0;

  const shouldRunTestsMobile = utilsChanged || mobileAppChanged;
  const shouldRunTestsWeb = utilsChanged || webAppChanged;

  const commands = [
    { title: 'Jest Mobile App', value: `cd mobile-app; yarn test; cd ..`, disabled: !shouldRunTestsMobile, selected: shouldRunTestsMobile },
    { title: 'Typecheck Mobile App', value: `cd mobile-app; yarn typecheck; cd ..`, disabled: !shouldRunTestsMobile, selected: shouldRunTestsMobile },
    { title: 'Format Mobile App', value: `cd mobile-app; yarn format; cd ..`, selected: mobileAppChanged },
    { title: 'Jest Web App', value: `cd web-app; yarn test;cd ..`, disabled: !shouldRunTestsWeb, selected: shouldRunTestsWeb },
    { title: 'Typecheck Web App', value: `cd web-app; yarn typecheck;cd ..`, disabled: !shouldRunTestsWeb, selected: shouldRunTestsWeb },
    { title: 'Format Web App', value: `cd web-app; yarn format;cd ..`, selected: webAppChanged },
  ]

  const exitCode = await runInteractive(commands, { prompt: 'Which features would you like to test?', warn: '- No Files to test.' });

  process.exit(exitCode)
}

run().catch(scriptError)
