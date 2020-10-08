function pipe
  cat $argv ^/dev/null | tr -d '\n' | read -l input

  set -ql input; or set -l input $argv

  if test -n "$input"
    echo $input | tr -d '\n'
  end
end

function trim
  pipe | sed 's/^ *//;s/ *$//'
end

function copy
  pipe | pbcopy
end