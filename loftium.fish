function db-reset
    node /Users/matthewkoppe/.config/fish/functions/scripts/node/reset-db.js
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
    dr bundle exec rspec $argv # | grep "rspec" | sed s/^rspec\ // | sed s/\#.\*//)
end