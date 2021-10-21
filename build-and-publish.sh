#!/usr/bin/env bash

set -ex

image_name="${1:-"eldermael/micronaut-pulumi"}"

if [[ ! -d "infrastructure/crds" ]]; then

  mkdir -p "infrastructure/crds"

  kubectl get crds podmonitors.monitoring.coreos.com -o yaml > "infrastructure/crds/podmonitor.yml"

  pushd "infrastructure"

  crd2pulumi --nodejs "crds/podmonitor.yml"

  popd

fi

./gradlew dockerBuild "-DimageName=${image_name}"

docker push "${image_name}:0.1"

pulumi -C infrastructure config set 'image-name' "${image_name}"
pulumi -C infrastructure config set --secret 'micronaut-secret' "Hello from a K8s secret"

pulumi -C infrastructure up --yes