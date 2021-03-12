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

module FlightJobScriptAPI
  class CommandError < Sinja::ServiceUnavailable; end

  class SystemCommand
    # Used to ensure each user is only running a single command at at time
    # NOTE: These objects will be indefinitely cached in memory until the server
    #       is restarted. This may constitute a memory leak if an indefinite
    #       number of users access the service.
    #       Consider refactoring
    def self.mutexes
      @mutexes ||= Hash.new { |h, k| h[k] = Mutex.new }
    end

    def self.flight_list_templates(**opts)
      new(*FlightJobScriptAPI.config.flight_job, 'list-templates', '--json', **opts).tap(&:wait)
    end

    def self.flight_info_template(id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'info-template', id, '--json', **opts).tap(&:wait)
    end

    def self.flight_list_scripts(**opts)
      new(*FlightJobScriptAPI.config.flight_job, 'list-scripts', '--json', **opts).tap(&:wait)
    end

    def self.flight_info_script(id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'info-script', id, '--json', **opts).tap(&:wait)
    end

    def self.flight_create_script(template_id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'create-script', template_id, '--json', '--stdin', **opts).tap(&:wait)
    end

    def self.flight_list_jobs(**opts)
      new(*FlightJobScriptAPI.config.flight_job, 'list-jobs', '--json', **opts).tap(&:wait)
    end

    def self.flight_info_job(id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'info-job', id, '--json', **opts).tap(&:wait)
    end

    def self.flight_submit_job(script_id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'submit-job', script_id, '--json', **opts).tap(&:wait)
    end

    attr_reader :cmd, :user, :mutex, :stdin
    attr_accessor :stdout, :stderr, :status

    def initialize(*cmd, user:, mutex: nil, stdin: nil)
      @cmd = cmd
      @user = user
      @stdin = stdin
      @mutex = self.class.mutexes[user]
    end

    def wait
      return if @wait
      run
      @wait ||= true
    end

    private

    def passwd
      @passwd ||= Etc.getpwnam(user)
    end

    def env
      @env ||= {
        'PATH' => FlightJobScriptAPI.app.config.command_path,
        'HOME' => passwd.dir,
        'USER' => user,
        'LOGNAME' => user
      }
    end

    def run
      # Establish pipes for stdout/stderr
      # NOTE: Must be first due to the ensure block
      out_read, out_write = IO.pipe
      err_read, err_write = IO.pipe
      in_read,  in_write  = IO.pipe

      mutex.synchronize do
        # Write the standard input if required
        in_write.write(stdin) if stdin

        pid = Kernel.fork do
          # Close the parent pipes
          out_read.close
          err_read.close
          in_write.close

          # Become the user
          Process::Sys.setgid(passwd.gid)
          Process::Sys.setuid(passwd.uid)
          Process.setsid

          # Execute the command
          FlightJobScriptAPI.logger.info("Executing: #{cmd.join(' ')}")
          opts = {
            unsetenv_others: true, close_others: true, chdir: passwd.dir,
            out: out_write, err: err_write, in: in_read
          }
          Kernel.exec(env, *cmd, **opts)
        end

        # Close the child pipes
        out_write.close
        err_write.close
        in_read.close

        # Wait for the command to finish within the timelimit
        signal = 'TERM'
        begin
          _, status = Timeout.timeout(FlightJobScriptAPI.app.config.command_timeout) do
            Process.wait2(pid)
          end
        rescue Timeout::Error
          Process.kill(-Signal.list[signal], pid)
          signal = 'KILL'
          retry
        end

        # Store the results
        self.status = status
        self.stdout = out_read.read
        self.stderr = err_read.read

        FlightJobScriptAPI.logger.debug <<~DEBUG
          STATUS: #{status.exitstatus}
          STDIN:
          #{ stdin ? stdin : "(Not Provided)"}
          STDOUT:
          #{stdout}
          STDERR:
          #{stderr}
        DEBUG
      end
    ensure
      out_read.close unless out_read.closed?
      out_write.close unless out_write.closed?
      err_read.close unless err_read.closed?
      err_write.close unless err_write.closed?
      in_read.close unless in_read.closed?
      in_write.close unless in_write.closed?
    end
  end
end
