#!/bin/bash

# Ensure jq is on the path
set -e
which "jq"

# Specify the template for the JSON response
read -r -d '' template <<'TEMPLATE' || true
{
  id: ($id),
  stdout: ($stdout),
  stderr: ($stderr)
}
TEMPLATE

# Submit the job to the scheduler
output=$(sbatch "$1")
if [[ $? -ne 0 ]]; then
  exit $?
fi

# Determine the scheduler's ID
id=$(echo "$output" | cut -d' ' -f4)
if [[ $? -ne 0 ]]; then
  exit $?
fi

# Fetch the details about the job
control=$(scontrol show job "$id")
if [[ $? -ne 0 ]]; then
  exit $?
fi

# Extract the sdout/stderr paths
stdout=$(echo "$control" | grep -E "^\s*StdOut=" | sed "s/^\s*StdOut=//g")
stderr=$(echo "$control" | grep -E "^\s*StdErr=" | sed "s/^\s*StdErr=//g")

# Render and return the JSON payload
echo '{}' | jq --arg id "$id" --arg stdout "$stdout" --arg stderr "$stderr" "$template" | tr -d "\n"
