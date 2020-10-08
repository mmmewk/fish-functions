function prompt
  while true
    read -l -P (echo $argv) confirm

    switch $confirm
      case Y y
        return 0
      case '' N n
        return 1
    end
  end
end