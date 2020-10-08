function ch
  argparse s/space= -- $argv

  if set -q _flag_s
    echo "Set Clubhouse Space to $_flag_s"
    set CLUBHOUSE_SPACE $_flag_s
  end

  set -e clubhouse_stories

  if test (count $argv) -gt 1
    set clubhouse_stories $argv
  else
    set clubhouse_stories (git current | string match -r -a 'ch([0-9]*)' | grep '^[0-9]*$')
  end

  if set -q clubhouse_stories
    for story in $clubhouse_stories
      open "https://app.clubhouse.io/$CLUBHOUSE_SPACE/story/$story"
    end
  else
    open "https://app.clubhouse.io/$CLUBHOUSE_SPACE/stories"
  end
end