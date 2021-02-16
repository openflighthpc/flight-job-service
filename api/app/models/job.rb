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

class Job < ApplicationModel
  attr_reader :script
  attr_writer :id, :user

  validates :script, presence: true

  validate on: :submit do
    script_valid = script&.valid?
    if script_valid && submitted?
      errors.add(:submitted, 'the job has already been submitted')
    elsif ! script_valid
      # NOTE: This is a bit of a white-lie, the script could exist but is otherwise
      # invalid. However the API treats scripts in this state as non-existent
      errors.add(:script, 'does not exist')
    end
  end

  def id
    @id ||= SecureRandom.uuid
  end

  def submitted?
    File.exists? metadata_path
  end

  def script=(script)
    if @script
      errors.add(:script, 'can not be changed')
    else
      @script = script
    end
  end

  # Default the user to be the same as the associated script
  # This makes restoring the Job from cache easier
  def user
    @user ||= script&.user
  end

  def metadata_path
    @metadata_path ||= begin
      File.join(FlightJobScriptAPI.config.internal_data_dir, user, id, 'metadata.yaml')
    end
  end

  def submit
    FileUtils.mkdir_p File.dirname(metadata_path)
    FileUtils.touch metadata_path

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
      env = {
        'PATH' => FlightJobScriptAPI.app.config.command_path,
        'HOME' => passwd.dir,
        'USER' => script.user,
        'LOGNAME' => script.user
      }
      Kernel.exec(env, *cmd, unsetenv_others: true, close_others: true, chdir: passwd.dir)
    end

    # Run the command
    begin
      _, status = Timeout.timeout(FlightJobScriptAPI.app.config.command_timeout) do
        Process.wait2(pid)
      end
    rescue Timeout::Error
      Process.kill('TERM', pid)
      retry
    end

    # Report back if it was successful
    status.success?
  end
end
