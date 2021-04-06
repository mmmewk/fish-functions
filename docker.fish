function dr
    docker-compose run --rm web $argv
end

function de
    docker-compose exec web $argv
end