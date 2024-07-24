#!/bin/bash

# File path for .env
ENV_FILE=".env"

# Property name and new value
PROPERTY_NAME="WEBHOOK_PATH"
NEW_VALUE=$(uuidgen)

# Check if .env file exists
if [ ! -f "${ENV_FILE}" ]; then
    echo "${ENV_FILE} not found!"
    exit 1
fi

# Use awk to replace the value of the specified property
awk -v prop="${PROPERTY_NAME}" -v value="${NEW_VALUE}" '
    BEGIN { FS="="; OFS="="; found=0 }
    $1 == prop {
        $2 = value
        found=1
    }
    { print }
    END {
        if (!found) {
            print prop "=" value
        }
    }
' "${ENV_FILE}" > "${ENV_FILE}.tmp" && mv "${ENV_FILE}.tmp" "${ENV_FILE}"

# Print confirmation
echo "Updated ${PROPERTY_NAME} to ${NEW_VALUE} in ${ENV_FILE}."
