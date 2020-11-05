const { prompt, scriptError } = require('matts-dev-tools/utils'); 

async function run() {
  const confirmed = await prompt(process.argv[2]);
  process.exit(confirmed ? 0 : 1);
}

run().catch(scriptError);
