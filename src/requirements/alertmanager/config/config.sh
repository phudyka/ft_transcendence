#!/bin/bash
if [ -f /alertmanager/alertmanager.yml.tmp ]
then
    echo $DISCORD_WEBHOOK_URL >> alertmanager.yml
    rm /alertmanager/alertmanager.yml.tmp
fi

./alertmanager