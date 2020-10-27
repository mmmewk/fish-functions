const { runInteractive } = require('./interactive-script-exec');

async function run() {
  commands = [
    { title: 'Sleep for one second', value: 'sleep 1' },
    { title: 'ls in other cwd', value: 'ls', cwd: '/Users/matthewkoppe/dev/lease-backend' },
    { title: 'Sleep for another second', value: 'sleep 1' },
    { title: 'Echo into the void', value: 'echo into the void' },
    { title: 'Command that should fail', value: 'echo foo;exit 1' },
    { title: 'Command should never be reached', value: 'echo ahh im naked' },
  ]

  const exitCode = await runInteractive(commands);

  process.exit(exitCode);
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)