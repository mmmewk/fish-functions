const { runInteractive, tryCommand } = require('./interactive-script-exec');

async function run() {
  commands = [
    { title: 'Hi', value: 'sleep 1;echo hi' },
    { title: 'Bye', value: 'sleep 1;echo bye' },
    { title: 'Why', value: 'sleep 1;echo why' },
    { title: 'Should Fail', value: 'fail' },
  ]

  await runInteractive(commands)
  // await tryCommand('sleep 1');
  // await tryCommand('sleep 1');
  // await tryCommand('sleep 1');
  // await tryCommand('sleep 1');
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)