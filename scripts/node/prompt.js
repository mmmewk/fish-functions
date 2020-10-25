const prompts = require('prompts');

async function run() {
  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: process.argv[2],
  });

  process.exit(confirmed ? 0 : 1);
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)