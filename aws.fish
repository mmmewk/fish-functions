function aws-config
  nano ~/.aws/config
end

function aws-creds
  nano ~/.aws/credentials
end

function aws-console
  if [ $AWS_PROFILE != $argv[1] ]
    open https://$AWS_DEFAULT_REGION.console.aws.amazon.com/console/logout!doLogout
    aws-profile $argv[1]
  end
  aws-login $argv[2]
end

function aws-profile
  export AWS_PROFILE="$argv[1]"
  export AWS_DEFAULT_REGION="us-west-2"
end

function aws-login
  ruby ~/.config/fish/functions/scripts/ruby/aws-login.rb $argv
end