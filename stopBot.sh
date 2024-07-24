#!/bin/bash

## Check if a port number is provided
#if [ -z "$1" ]; then
#  echo "Usage: $0 port_number"
#  exit 1
#fi
#
## Port number to check
#PORT=$1
#
## Find the PID of the process using the specified port
#PIDS=$(lsof -t -i :$PORT)
#
## Check if any PIDs were found
#if [ -z "$PIDS" ]; then
#  echo "No processes found using port $PORT"
#  exit 0
#fi
#
## Kill the processes
#for PID in $PIDS; do
#  echo "Killing process $PID"
#  kill -9 $PID
#done
#
#echo "All processes using port $PORT have been killed."

#!/bin/bash

# Find the process ID of the node script (bot.mjs)
PID=$(ps -ef | grep 'lsof -i :89' | grep -v grep | awk '{print $2}')

# Check if PID is found
if [ -n "$PID" ]; then
    echo "Killing process with PID: $PID"
    kill -9 $PID
else
    echo "No process found for lsof -i :89"
fi
