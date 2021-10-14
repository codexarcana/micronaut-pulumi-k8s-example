#!/usr/bin/env bash

set -ex

image_name="${1:-"eldermael/micronaut-pulumi"}"

./gradlew dockerBuild "-DimageName=${image_name}"

docker push "${image_name}:0.1"

pulumi -C infrastructure config set 'image-name' "${image_name}"

pulumi -C infrastructure up --yes