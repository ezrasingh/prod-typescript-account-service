#!/bin/bash

set -e

mkdir -p certs/

openssl genrsa -out private.pem 4096

openssl rsa -in private.pem -outform PEM -pubout -out public.pem

openssl enc -base64 <<< $(cat private.pem) > private.key

openssl enc -base64 <<< $(cat public.pem) > public.cert

rm public.pem private.pem

mv public.cert private.key certs/
