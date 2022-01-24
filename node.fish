function kill_port
  set -l port $argv[1]
  lsof -i tcp:$port | grep LISTEN | awk '{print $2}' | xargs kill -9
end
