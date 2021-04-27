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

require 'securerandom'

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
      new(*FlightJobScriptAPI.config.flight_job, 'list-templates', '--json', **opts).tap(&:run)
    end

    def self.flight_info_template(id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'info-template', id, '--json', **opts).tap(&:run)
    end

    def self.flight_list_scripts(**opts)
      new(*FlightJobScriptAPI.config.flight_job, 'list-scripts', '--json', **opts).tap(&:run)
    end

    def self.flight_info_script(id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'info-script', id, '--json', **opts).tap(&:run)
    end

    def self.flight_create_script(template_id, name = nil, answers: nil, notes: nil, **opts)
      # Define the paths so they can be cleaned up
      # NOTE: Tempfile should not be used as the file permissions will be incorrect
      #       Instead the paths are defined with UUIDs and then created after the command forks
      answers_path = File.join('/tmp', "flight-job-script-api-#{SecureRandom.uuid}")
      notes_path = File.join('/tmp', "flight-job-script-api-#{SecureRandom.uuid}")
      args = name ? [template_id, name] : [template_id]
      args.push('--answers', "@#{answers_path}") if answers
      args.push('--notes', "@#{notes_path}") if notes
      new(*FlightJobScriptAPI.config.flight_job, 'create-script', *args, '--json', **opts).tap do |sys|
        sys.run do
          File.write answers_path, answers if answers
          File.write notes_path, notes if notes
        end
      end
    ensure
      FileUtils.rm_f answers_path
      FileUtils.rm_f notes_path
    end

    def self.flight_edit_script_notes(script_id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'edit-script-notes', script_id, '--json', '--notes', '@-', **opts).tap(&:run)
    end

    def self.flight_edit_script(script_id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'edit-script', script_id, '--json', '--force', '--content', '@-', **opts).tap(&:run)
    end

    def self.flight_delete_script(id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'delete-script', id, '--json',**opts).tap(&:run)
    end

    def self.flight_list_jobs(**opts)
      new(*FlightJobScriptAPI.config.flight_job, 'list-jobs', '--json', **opts).tap(&:run)
    end

    def self.flight_info_job(id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'info-job', id, '--json', **opts).tap(&:run)
    end

    def self.flight_submit_job(script_id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'submit-job', script_id, '--json', **opts).tap(&:run)
    end

    attr_reader :cmd, :user, :mutex, :stdin
    attr_accessor :stdout, :stderr, :exitstatus

    def initialize(*cmd, user:, mutex: nil, stdin: nil)
      @cmd = cmd
      @user = user
      @stdin = stdin
      @mutex = self.class.mutexes[user]
    end

    def run(&block)
      # Establish pipes for stdout/stderr
      # NOTE: Must be first due to the ensure block
      out_read, out_write = IO.pipe
      err_read, err_write = IO.pipe
      in_read,  in_write  = IO.pipe

      mutex.synchronize do
        # Write the standard input if required
        in_write.write(stdin) if stdin

        FlightJobScriptAPI.logger.debug("Forking Process")
        pid = Kernel.fork do
          # Close the parent pipes
          out_read.close
          err_read.close
          in_write.close

          # Become the user
          Process::Sys.setgid(passwd.gid)
          Process::Sys.setuid(passwd.uid)
          Process.setsid

          # Allow the command to be modified after becoming the requested user
          # This is useful when trying to create a file with the correct file permissions
          block.call if block

          # Execute the command
          opts = {
            unsetenv_others: true, close_others: true, chdir: passwd.dir,
            out: out_write, err: err_write, in: in_read
          }
          # NOTE: Keep the log before the exec for timing purposes
          FlightJobScriptAPI.logger.info("Executing (#{user}): #{cmd.join(' ')}")
          Kernel.exec(env, *cmd, **opts)
        end

        # Close the child pipes
        out_write.close
        err_write.close
        in_read.close

        # Wait for the command to finish within the timelimit
        signal = 'TERM'
        begin
          FlightJobScriptAPI.logger.debug("Waiting for pid: #{pid}")
          _, status = Timeout.timeout(FlightJobScriptAPI.app.config.command_timeout) do
            Process.wait2(pid)
          end
        rescue Timeout::Error
          FlightJobScriptAPI.logger.error("Sending #{signal} to: #{pid}")
          Process.kill(-Signal.list[signal], pid)
          signal = 'KILL'
          retry
        end

        # Store the results
        if status.exitstatus
          self.exitstatus = status.exitstatus

        # The exit status from signals aren't always set, instead they can be inferred
        elsif status.signaled?
          FlightJobScriptAPI.logger.warn "Inferring exit code from signal #{Signal.signame(status.termsig)} (pid: #{pid})"
          self.exitstatus = status.termsig + 128

        # If all else fails, say 128
        else
          FlightJobScriptAPI.logger.error "No exit code provided (pid: #{pid})!"
          self.exitstatus = 128
        end

        self.stdout = out_read.read
        self.stderr = err_read.read

        FlightJobScriptAPI.logger.debug <<~DEBUG

          COMMAND: #{cmd.join(' ')}
          USER: #{user}
          PID: #{pid}
          STATUS: #{exitstatus}
          STDIN:
          #{stdin.to_s}
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
  end
end
