#!/bin/bash

set -e
set -u

user_delimiter=':'
db_delimiter=';'

# ? example configuration
# export POSTGRES_MULTIPLE_DATABASES=$(echo "") 


function create_user_and_database() {
	local database=$(echo $1 | tr $user_delimiter ' ' | awk  '{print $1}')
  local owner=$(echo $1 | tr $user_delimiter ' ' | awk  '{print $2}')
	echo "  Creating user: '$owner' and database: '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<EOSQL
      CREATE ROLE $owner PASSWORD '$POSTGRES_PASSWORD' LOGIN;
      CREATE DATABASE $database;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $owner;
EOSQL
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d $database <<EOSQL
    CREATE SCHEMA IF NOT EXISTS $POSTGRES_SCHEMA AUTHORIZATION $owner;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Creating development and staging databases..."
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr $db_delimiter ' '); do
    create_user_and_database $db
	done
  echo "Complete!"
fi