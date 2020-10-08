function kube-dash
  echo (aws eks get-token --cluster-name bedrock --profile pineapple --region us-west-2 | jq -r '.status.token') | pbcopy
  open "http://localhost:8080/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/namespace?namespace=default"
  kubectl proxy --port=8080 --address='0.0.0.0' --disable-filter=true
end

function kube-deploy
  set -l year (date "+%Y")
  set -l month (date "+%m")
  set -l namespace $argv[1]
  set -l tagversion (git tag | grep $namespace | grep "$year.$month" | cut -d '.' -f3 | cut -d '-' -f1 | sort -rn | head -n 1)
  set -l branch (git branch | grep "*" | cut -d ' ' -f2)

  if [ tagversion = '' ]
    set -l tagversion 0
  end

  set -l tagversion (math $tagversion + 1)
  set -l tag "$year.$month.$tagversion-$namespace"
  
  if prompt "this will add the tag '$tag' and deploy the branch '$branch' to the environment '$namespace'. Are you sure (Y/N)? "
    git tag $tag
    git push origin $tag
  end
end

function kube-ssh
  for arg in $argv
    if [ $arg = '-n' ]
      set var namespace
    else if [ $arg = '-p' ]
      set var pod
    else if set -q var
      set $var $arg
      set -e var
    end
  end

  if not set -q pod
    echo "option -p not set. Please specify a pod to ssh into."
    return 
  end

  if not set -q namespace
    echo "option -n not set. Please specify an environment to ssh into."
    return 
  end

  set -l podname (kubectl get pods -n prod | grep sso | grep Running |  head -1 | cut -d ' ' -f1)

  if not set -q podname; or [ $podname = '' ]
    echo "Pod not found. Please specify an existing pod namespace combination to ssh into."
    return 
  end

  echo "SSH into $pod in environment $namespace"
  kubectl exec -it $podname -n $namespace -- /bin/sh
end