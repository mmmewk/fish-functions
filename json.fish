function append-json
  set -l keys (get-json-keys $argv[1])
  set jsonstring \{\n
  for key in $keys
    set -l $key (get-json-value $argv[1] $key)
    set -a jsonstring \t\"$key\": \"$$key\",\n
  end
  set -a jsonstring \t\"$argv[2]\": \"$argv[3]\"\n
  set -a jsonstring \}
  echo $jsonstring > $argv[1]
end

function get-json-keys
  cat $argv[1] | grep '".*":\s*".*"' | sed 's/:.*$//' | tr -d " \"\t" 
end

function get-json-value
  cat $argv[1] | grep \"$argv[2]\" | sed 's/\".*\": *//;s/,$//;s/\"//g' | tr -d " \"\t"
end

function parse-json
  for key in (get-json-keys $argv[2])
    set -g $argv[1]\_$key (get-json-value $argv[2] $key)
  end
end

function remove-json
  set -l keys (get-json-keys $argv[1])
  set jsonstring \{\n
  for key in $keys
    if [ $key != $argv[2] ]
      set -l $key (get-json-value $argv[1] $key)
      set -a jsonstring \t\"$key\": \"$$key\",\n
    end
  end
  set -l lastelement (echo $jsonstring[-1] | sed 's/\(.*\),/\1 /')
  set jsonstring $jsonstring[1..-2] $lastelement\n
  set -a jsonstring \}
  echo $jsonstring > $argv[1]
end