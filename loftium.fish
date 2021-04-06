function db-reset
    yarn db-clone-production
end

function ticketnum
    set -l num (git current | string match -r -a '[\w-]*$' | trim)
    if string match -r 'EN-[\w]*' $num
        set -e num
    end
end

function ticket
    set -l ticketnum (ticketnum)
    echo "https://loftium.atlassian.net/browse/$ticketnum"
end

function rs
    de bundle exec rspec $argv
end

function srb-update
    de ./sorbet/rbi-update.sh
end

function rails-reset
    de touch tmp/restart.txt
end
