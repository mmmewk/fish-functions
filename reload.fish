function fish-reload
  source ~/.config/fish/config.fish
end

function reload
  if test (count $argv) -eq 1
    to $argv[1]
  end
  restart
  if test (count $argv) -eq 1
    back
  end
end

function reload!
  if test (count $argv) -eq 1
    to $argv[1]
  end
  restart!
  if test (count $argv) -eq 1
    back
  end
end

function reload!!
  if test (count $argv) -eq 1
    to $argv[1]
  end
  restart!!
  if test (count $argv) -eq 1
    back
  end
end

function restart
  touch tmp/restart.txt
end

function restart!
  yarn
  bundle
  restart
end

function restart!!
  bin/spring stop
  puma-dev -stop
  restart!
end
