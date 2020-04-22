#!/bin/bash

set -e

openssl genrsa -out private.pem 4096

openssl rsa -in private.pem -outform PEM -pubout -out public.pem

openssl enc -base64 <<< $(cat private.pem) > private.key

openssl enc -base64 <<< $(cat public.pem) > public.cert

rm public.pem
rm private.pem
