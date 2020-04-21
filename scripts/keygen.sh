#!/bin/bash

set -e

function create-cert () {
  local input_file=$1
  local output_file=$(echo $2.pem)

  # ? encode key file
  openssl base64 -in ${input_file} -out ${output_file}

  # ? sanitize the new PEM file
  cat ${output_file} | tr -d ' ' < ${output_file} | cat /dev/null

  rm ${input_file}
}

ssh-keygen -q -t rsa -N '' -f key <<< y >/dev/null

create-cert key private

create-cert key.pub public

