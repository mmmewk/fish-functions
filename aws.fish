function aws-config
  nano ~/.aws/config
end

function aws-creds
  nano ~/.aws/credentials
end

function aws-logout
  open https://console.aws.amazon.com/console/logout!doLogout
end

function aws-profile
  export AWS_PROFILE="$argv[1]"
end

function aws-login
  argparse r/region -- $argv
  ruby ~/.config/fish/functions/scripts/ruby/aws-login.rb $argv[1] $_flag_r
end