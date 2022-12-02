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
