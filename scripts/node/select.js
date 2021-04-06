const { scriptError, promptSelect } = require('matts-dev-tools/utils'); 

async function run() {
  const option = await promptSelect(process.argv[2], process.argv.slice(3));
  console.log(option);
  process.exit(0);
}

run().catch(scriptError);
