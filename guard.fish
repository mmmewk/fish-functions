function lease-backend-guards
  if test (pwd) = "/Users/matthewkoppe/dev/lease-backend"
    set -l files (git ls-files -m)
    set -e linted_files
    set -e specs
    for file in $files
      if string match -r -q '^app/|lib/|config' $file && string match -r -q 'rb|rake$' $file
        set -a linted_files $file
      end
      set spec (echo $file | sed s/^app\\//spec\\//)
      set spec (echo $spec | sed s/^lib\\//spec\\//)
      if not string match -r _spec.rb\$ $spec
        set spec (echo $spec | sed s/\\.rb\$/_spec.rb/)
        set spec (echo $spec | sed s/\\.rake\$/_spec.rb/)
      end

      echo "Checking spec $spec"

      if test -e $spec && string match -r -q '^spec' $spec
        set -a specs $spec
      end
    end
    if not set -q linted_files[1]
      return 0
    end
    echo "Typechecking and linting files: "(set_color blue) $linted_files (set_color normal)
    if not srb tc $linted_files
      return 1
    end
    if not bundle exec rubocop $linted_files
      return 1
    end
    if not set -q specs[1]
      return 0
    end
    echo "Running Tests: "(set_color blue) $specs (set_color normal)
    if not rs $specs
      return 1
    end
  end
  return 0
end