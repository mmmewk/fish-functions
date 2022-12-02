function staging-console
  heroku run CONSOLE_USER_EMAIL=matthew@loftium.com rails c --app=lease-staging
end

function production-console
  heroku run CONSOLE_USER_EMAIL=matthew@loftium.com rails c --app=lease-production
end
