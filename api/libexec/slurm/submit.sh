#!/bin/bash

# Submit the job to the scheduler
output=$(sbatch "$1")
if [[ $? -ne 0 ]]; then
  exit $?
fi

echo "{ \"id\": \"$(echo "$output" | cut -d' ' -f4)\" }"
