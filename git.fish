function gf
  set -l branch (git branch -a | grep $argv[1] | head -1 | sed s/\*// | trim)
  argparse e/echo -- $argv

  if set -q _flag_e
    echo $branch
  else
    gco (echo $branch | sed 's/remotes\/origin\///')
  end
end

function gco
  git checkout $argv
end

function gcm
  argparse f/force -- $argv
  if not set -q _flag_f && not lease-backend-guards
    return 1
  end
  git add .
  set -l ticketnum (ticketnum)
  if set -q ticketnum[1]
    git commit -m "[$ticketnum] $argv"
  else 
    git commit -m $argv
  end
end

function gcb
  node /Users/matthewkoppe/.config/fish/functions/scripts/node/clean-branches.js
end

function gbr
  git stash
  git checkout -b $argv
  git stash apply
end

function gnb
  gf release/sp
  git pull
  git checkout -b mekoppe/ch$argv[1]/$argv[2]
end

function gs
  git status
end

function gsync
  if test (count $argv) -eq 0
    return
  end
  set -l branch (git current)
  git save
  gpu
  gco $argv[1]
  git pull
  git pull origin $branch --squash
  gcm "pull: $branch"
  gs
  if prompt 'are you sure you want to merge' $branch ' into ' $argv[1] ' (y/n): '
    git push
  end
  gco $branch
end

function git-stage
  if test (count $argv) -eq 1
    gf $argv[1]
  end
  set -l branch (git current)
  git save
  git push -u origin $branch
  gco staging
  git pull
  git pull origin $branch --squash
  git commit -m "pull: $branch"
  git status
  if prompt 'are you sure you want to stage' $branch '(y/n): '
    git push
  end
end

function git-deploy
  git save
  gco master
  git pull
  git pull origin develop --squash
  set -l message deployment: (date '+%m/%d/%y')
  git commit -m $message
  git status
  if prompt 'are you sure you want to deploy (y/n): '
    git push
  end
end

function repo
  argparse e/echo p/project= -- $argv
  if set -q _flag_p
    to $_flag_p
  end
  set repo_domain (git remote get-url origin | cut -d ':' -f1 | cut -d '@' -f2)
  set repo_path (git remote get-url origin | cut -d ':' -f2 | cut -d '.' -f1)
  
  if set -q _flag_e
    echo "https://$repo_domain/$repo_path"
  else
    open "https://$repo_domain/$repo_path"
  end
  if set -q _flag_p
    back
  end
end

function pr
  argparse b/base= t/title= -- $argv
  if set -q $_flag_b
    set base $_flag_b
  else
    set base master
  end
  set ticket (ticketnum)
  set title $_flag_t
  if set -q ticket[1]
    set title "[$ticket] $title"
  end

  gh pr create --base $base --draft
end

function gpu
  if test (git current) = "master"
    if prompt "Are you sure you want to push to master (y/n)? "
      gpu!
    end
  else
    gpu!
  end
end

function gpu!
  git push -u origin (git current)
end

function gdelr
  git push origin --delete $argv[1]
end

function gdel
  git branch -D $argv[1]
end

function grb
  echo "This will delete and recreate the branch $argv[1]."
  if prompt "Are you sure (y/n)? "
    gco master
    gdel $argv[1]
    gdelr $argv[1]
    gco -b $argv[1]
    gpu
  end
end

function gconf
  nano ~/.gitconfig
end