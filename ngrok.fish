function tunnel
  set -l port $argv[1]
  /Users/matthewkoppe/.config/fish/functions/scripts/bash/ngrok http $port -host-header="localhost:$port"
end