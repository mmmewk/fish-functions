function reload-functions
  for func in ~/.config/fish/functions/*
    source $func
  end
end
