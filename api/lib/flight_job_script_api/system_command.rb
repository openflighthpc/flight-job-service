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
require 'pathname'

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

    def self.flight_view_job_stdout(job_id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'view-job-stdout', job_id, **opts).tap(&:run)
    end

    def self.flight_view_job_stderr(job_id, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'view-job-stderr', job_id, **opts).tap(&:run)
    end

    def self.flight_view_job_results(job_id, filename, **opts)
      new(*FlightJobScriptAPI.config.flight_job, 'view-job-results', job_id, filename, **opts).tap(&:run)
    end

    def self.recursive_glob_dir(dir, **opts)
      new(:noop, 'recursively glob directory', **opts).tap do |sys|
        sys.run do
          exit 20 unless Dir.exists?(dir)
          json = Dir.glob(File.join(dir, '**/*'))
                    .map { |p| Pathname.new(p) }
                    .reject(&:directory?)
                    .reject(&:symlink?)
                    .select(&:readable?) # XXX: Non-readable files would be an odd occurrence
                    .map { |p| { file: p.to_s, size: p.size } }
          puts JSON.generate(json)
        end
      end
    end

    attr_reader :cmd, :user, :mutex, :stdin, :env, :stdout, :stderr
    attr_accessor :exitstatus, :pid

    def initialize(*cmd, user:, stdin: nil, env: {})
      @stdout = ""
      @stderr = ""
      @cmd = cmd
      @user = user
      @stdin = stdin
      @env ||= {
        'PATH' => FlightJobScriptAPI.app.config.command_path,
        'HOME' => passwd.dir,
        'USER' => user,
        'LOGNAME' => user
      }.merge(env)
    end

    def run(&block)
      with_fork do
        # Log the command has been forked
        FlightJobScriptAPI.logger.debug("Forked Command (#{user}): #{stringified_cmd}")

        # Close the parent pipes
        @out_read.close
        @err_read.close
        @in_write.close

        # Become the user
        Process::Sys.setgid(passwd.gid)
        Process::Sys.setuid(passwd.uid)
        Process.setsid

        # Allow the command to be modified after becoming the requested user
        # This is useful when trying to create a file with the correct file permissions
        $stdout = @out_write
        $stderr = @err_write
        block.call if block

        if cmd.first == :noop
           FlightJobScriptAPI.logger.debug("Nothing to exec")
        else
          # Execute the command
          opts = {
            unsetenv_others: true, close_others: true, chdir: passwd.dir,
            out: @out_write, err: @err_write, in: @in_read
          }
          # NOTE: Keep the log before the exec for timing purposes
          FlightJobScriptAPI.logger.debug("Executing (#{user}): #{stringified_cmd}")
          Kernel.exec(env, *cmd, **opts)
        end
      end
    ensure
      log_command
    end

    private

    def passwd
      @passwd ||= Etc.getpwnam(user)
    end

    def with_fork(&block)
      self.class.mutexes[user].synchronize do
        begin
          # Create the pipes
          @out_read,  @out_write = IO.pipe
          @err_read,  @err_write = IO.pipe
          @in_read,   @in_write  = IO.pipe

          # Start the thread
          @threads = [[@out_read, self.stdout], [@err_read, self.stderr]].map do |io, buffer|
            Thread.new do
              begin
                loop { buffer << io.readpartial(1024) }
              rescue IOError
                # NOOP - Both EOF and IO closed errors need to be caught
              end
            end
          end

          # Write the standard input if required
          # NOTE: This could *technically* block if stdin exceeds ~60KiB (system dependent)
          #       The large 'notes'/'answer' inputs are already "passed by file"
          #       Consider refactoring if it causes an issue
          @in_write.write(stdin) if stdin

          # Flag the start time
          start = Process.clock_gettime(Process::CLOCK_MONOTONIC)

          # Fork the child process
          FlightJobScriptAPI.logger.debug("Forking Process")
          self.pid = Kernel.fork(&block)

          # Close the child pipes
          @out_write.close
          @err_write.close
          @in_read.close

          # Wait for the child to end
          wait_for_status

          # Use the remaining time out to allow the threads to end naturally
          @threads.each do |thread|
            next unless thread.alive?
            now = Process.clock_gettime(Process::CLOCK_MONOTONIC)
            remaining = FlightJobScriptAPI.config.command_timeout + start - now
            break unless remaining > 0
            thread.join(remaining)
          end
        ensure
          # Confirm the threads have naturally finished
          if @threads && @threads.any?(&:alive?)
            FlightJobScriptAPI.logger.error <<~ERROR.chomp
              Failed to read all of stdout/stderr for pid: #{pid}
            ERROR
            self.exitstatus = 128 if self.exitstatus < 128 || self.exitstatus > 159
          end

          # Close the pipes and force the threads to finish
          @out_read.close  if @out_read   && !@out_read.closed?
          @out_write.close if @out_write  && !@out_write.closed?
          @err_read.close  if @err_read   && !@err_read.closed?
          @err_write.close if @err_write  && !@err_write.closed?
          @in_read.close   if @in_read    && !@in_read.closed?
          @in_write.close  if @in_write   && !@in_write.closed?

          # Join the threads
          (@threads || []).each do |thread|
            begin
              thread.join # NOTE: Dead threads can be joined multiple times without error
            rescue
              FlightJobScriptAPI.logger.error <<~ERROR.chomp
                An error occur when joining stdout/stdderr thread: #{$!}
              ERROR
            end
          end
        end
      end
    end

    def wait_for_status
      # Wait for the command to finish within the timelimit
      signal = 'TERM'
      begin
        FlightJobScriptAPI.logger.debug("Waiting for pid: #{pid}")
        Timeout.timeout(FlightJobScriptAPI.app.config.command_timeout) do
          Process.wait(pid)
        end
      rescue Timeout::Error
        FlightJobScriptAPI.logger.error("Sending #{signal} to: #{pid}")
        Process.kill(-Signal.list[signal], pid)
        signal = 'KILL'
        retry
      end

      status =  $?
      self.exitstatus = if status.exitstatus
        status.exitstatus
      elsif status.signaled?
        FlightJobScriptAPI.logger.warn <<~WARN.chomp
          Inferring exit code from signal #{Signal.signame(status.termsig)} (pid: #{pid})
        WARN
        status.termsig + 128
      else
        FlightJobScriptAPI.logger.error "No exit code provided (pid: #{pid})!"
        128
      end
    end

    def log_command
      FlightJobScriptAPI.logger.info <<~INFO.chomp

        COMMAND: #{stringified_cmd}
        USER: #{user}
        PID: #{pid}
        STATUS: #{exitstatus}
      INFO
      FlightJobScriptAPI.logger.debug <<~DEBUG

        STDIN:
        #{stdin.to_s}
        STDOUT:
        #{stdout}
        STDERR:
        #{stderr}
      DEBUG
    end

    def stringified_cmd
      @stringified_cmd ||= (cmd.first == :noop ? cmd[1..-1] : cmd)
        .map { |s| s.empty? ? '""' : s }.join(' ')
    end
  end
end
