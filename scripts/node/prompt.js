const { prompt, onError } = require('./utils'); 

async function run() {
  const confirmed = prompt(process.argv[2]);
  process.exit(confirmed ? 0 : 1);
}

run().catch(onError)