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
    set -l baseurl "https://loftium.atlassian.net/secure/RapidBoard.jspa?rapidView=2&projectKey=EN&modal=detail&selectedIssue="
    if set -q ticketnum[1]
        echo "$baseurl$ticketnum"
    end
end

function rs
    dr bundle exec rspec $argv # | grep "rspec" | sed s/^rspec\ // | sed s/\#.\*//)
end