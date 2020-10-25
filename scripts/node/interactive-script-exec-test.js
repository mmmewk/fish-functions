const { runInteractive } = require('./interactive-script-exec');

async function run() {
  commands = [
    { title: 'Hi', value: 'sleep 1' },
    { title: 'Bye', value: 'sleep 1' },
    { title: 'Why', value: 'sleep 1' },
    { title: 'Should Fail', value: 'asdf' },
  ]

  await runInteractive(commands)
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)