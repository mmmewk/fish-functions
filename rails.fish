function console
  if test (count $argv) -eq 1
    to $argv[1]
  end
  rails c
  if test (count $argv) -eq 1
    back
  end
end

function credentials
  env EDITOR="code --wait" rails credentials:edit $argv
end

function logger
  if test (count $argv) -eq 1
    to $argv[1]
  end
  tail -f log/development.log
  if test (count $argv) -eq 1
    back
  end
end

function puma-logger
  if test (count $argv) -eq 1
    to $argv[1]
  end
  tail -f ~/Library/Logs/puma-dev.log
  if test (count $argv) -eq 1
    back
  end
end

function link!
  puma-dev-unlink $argv[1]
  puma-dev link -n $argv[1] $argv[2]
end

function puma-dev-unlink
  if test -e ~/.puma-dev/$argv[1]
    unlink ~/.puma-dev/$argv[1]
  end
end

function serve
  if test (count $argv) -eq 1
    to $argv[1]
  end
  rails s
  if test (count $argv) -eq 1
    back
  end
end