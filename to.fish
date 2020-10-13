function to
  if test (count $argv) -eq 0
  else if test $argv[1] = 'functions'
    set destination ~/.config/fish/functions
  else
    set destination ~/dev/$argv[1]
  end

  set -g back (pwd)
  cd $destination
end

function back
  if set -q back
    cd $back
    set -e back
  end
end