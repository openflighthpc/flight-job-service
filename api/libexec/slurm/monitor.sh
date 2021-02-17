#!/bin/bash
#==============================================================================
# Copyright (C) 2021-present Alces Flight Ltd.
#
# This file is part of Flight Job Script Service.
#
# This program and the accompanying materials are made available under
# the terms of the Eclipse Public License 2.0 which is available at
# <https://www.eclipse.org/legal/epl-2.0>, or alternative license
# terms made available by Alces Flight Ltd - please direct inquiries
# about licensing to licensing@alces-flight.com.
#
# Flight Job Script Service is distributed in the hope that it will be useful, but
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR
# IMPLIED INCLUDING, WITHOUT LIMITATION, ANY WARRANTIES OR CONDITIONS
# OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY OR FITNESS FOR A
# PARTICULAR PURPOSE. See the Eclipse Public License 2.0 for more
# details.
#
# You should have received a copy of the Eclipse Public License 2.0
# along with Flight Job Script Service. If not, see:
#
#  https://opensource.org/licenses/EPL-2.0
#
# For more information on Flight Job Script Service, please visit:
# https://github.com/openflighthpc/flight-job-script-service
#==============================================================================

#-------------------------------------------------------------------------------
# WARNING - README
#
# This is an internally managed file, any changes maybe lost on the next update!
# Please clone the entire 'slurm' directory in order to modify this file.
#-------------------------------------------------------------------------------

# Ensure jq is on the path
set -e
which "jq"

# Specify the template for the JSON response
read -r -d '' template <<'TEMPLATE' || true
{
  state: ($state)
}
TEMPLATE

# Fetch the state of the job
control=$(scontrol show job "$1" 2>&1)
exit_status="$?"
if [[ "$exit_status" -eq 0 ]]; then
  state=$(echo "$control" | grep -E "\s*JobState=" | sed "s/^\s*JobState=\([^ ]*\).*/\1/g")
elif [[ "$control" == "slurm_load_jobs error: Invalid job id specified" ]]; then
  # The job either was never submitted correctly or slurm has cleaned up the
  # response before it could be fetched
  # NOTE: Should this be an UNKNOWN terminal state?
  state="FAILED"
else
  echo "$control" >&2
  exit "$exit_status"
fi

# Render and return the payload
echo '{}' | jq --arg state "$state" "$template" | tr -d "\n"
