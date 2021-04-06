function aws-config
  touch ~/.aws/config
  nano ~/.aws/config
end

function aws-creds
  touch ~/.aws/credentials
  nano ~/.aws/credentials
end

function aws-logout
  open https://console.aws.amazon.com/console/logout!doLogout
end

function aws-profile
  export AWS_PROFILE="$argv[1]"
end