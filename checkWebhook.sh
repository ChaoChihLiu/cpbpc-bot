#!/bin/bash


PROPERTIES_FILE=".env"

if [[ ! -f $PROPERTIES_FILE ]]; then
    echo "Properties file not found!"
    exit 1
fi

while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    key=$(echo $key | xargs)
    value=$(echo $value | xargs)
    export "$key=$value"
done < "$PROPERTIES_FILE"

echo $TELEGRAM_BOT_TOKEN;
echo $WEBHOOK_HOST;
echo $WEBHOOK_PATH;

curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo";


