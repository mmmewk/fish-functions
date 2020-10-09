function reload-functions
  for func in ~/.config/fish/functions/*
    if not test -d $func
      source $func
    end
  end
end
