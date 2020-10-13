function db-clone
    # TODO: check for heroku logged in
    if prompt "This will reset your local database to production state"
        to lease-backend

        # TODO: add param -a/app [lease-production lease-staging null => latest]
        heroku pg:backups:capture -a lease-production
        heroku pg:backups:download -a lease-production
        dr bundle exec rake db:drop db:create db:structure:load
        dr pg_restore --verbose --clean --no-acl --no-owner -h db --dbname=postgresql://postgres:@db:5432/lease-backend_development latest.dump
        rm latest.dump
        rm -rf storage
        dr bundle exec rake sanitize_db:all
        back
    end
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
    echo "$baseurl$ticketnum"
end

function rs
    dr bundle exec rspec $argv
end