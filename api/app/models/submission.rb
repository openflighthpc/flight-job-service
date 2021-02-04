# frozen_string_literal: true
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

class Submission < ApplicationModel
  attr_reader :script

  validates :script, presence: true

  validate do
    next if script&.valid?
    # NOTE: This is a bit of a white-lie, the script could exist but is otherwise
    # invalid. However the API treats scripts in this state as non-existent
    errors.add(:script, 'does not exist')
  end

  def id
    @id ||= SecureRandom.uuid
  end

  def script=(script)
    if @script
      errors.add(:script, 'can not be changed')
    else
      @script = script
    end
  end

  def run
    pid = Kernel.fork do
      # Establish the command
      cmd = [
        FlightJobScriptAPI.config.scheduler_command,
        script.script_path
      ]
      FlightJobScriptAPI.logger.info("Executing: #{cmd.join(' ')}")

      # Become the user
      passwd = Etc.getpwnam(script.user)
      Process::Sys.setgid(passwd.gid)
      Process::Sys.setuid(passwd.uid)
      Process.setsid

      # Execute the command
      # NOTE: What should happen to STDOUT/ STDERR?
      # Currently they are being redirected to the log file
      Kernel.exec({}, *cmd, unsetenv_others: true, close_others: true)
    end
    Process.detach(pid)
  end
end
