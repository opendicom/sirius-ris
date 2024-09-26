#!/bin/bash

# Get the name of the database to check from the MONGO_INITDB_DATABASE:
DB_NAME="${MONGO_INITDB_DATABASE}"

echo "Checking for database: ${DB_NAME}"

# Check if the database exists:
if mongosh --eval "db.getMongo().getDBNames().indexOf('${DB_NAME}') === -1"; then
  echo "Restoring database '${DB_NAME}' from archive..."
  mongorestore --archive="/dumps/entrypoint.dump"
else
  echo "Database '${DB_NAME}' already exists. Skipping restore."
fi
