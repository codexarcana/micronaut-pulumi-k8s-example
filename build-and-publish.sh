#!/usr/bin/env bash

set -ex

./gradlew dockerBuild

docker push eldermael/micronaut-pulumi:0.1

pulumi -C infrastructure up --yes