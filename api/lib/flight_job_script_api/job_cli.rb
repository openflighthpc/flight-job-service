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

  class JobCLI
    class << self
      # Used to ensure each user is only running a single command at at time
      # NOTE: These objects will be indefinitely cached in memory until the server
      #       is restarted. This may constitute a memory leak if an indefinite
      #       number of users access the service.
      #       Consider refactoring
      def mutexes
        @mutexes ||= Hash.new { |h, k| h[k] = Mutex.new }
      end

      def list_templates(**opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'list-templates', '--json', *includes, **opts).run
      end

      def info_template(id, **opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'info-template', id, '--json', *includes, **opts).run
      end

      def list_scripts(**opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'list-scripts', '--json', *includes, **opts).run
      end

      def info_script(id, **opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'info-script', id, '--json', *includes, **opts).run
      end

      def create_script(template_id, name = nil, answers: nil, notes: nil, **opts)
        # Define the paths so they can be cleaned up
        # NOTE: Tempfile should not be used as the file permissions will be incorrect
        #       Instead the paths are defined with UUIDs and then created after the command forks
        answers_path = File.join('/tmp', "flight-job-script-api-#{SecureRandom.uuid}")
        notes_path = File.join('/tmp', "flight-job-script-api-#{SecureRandom.uuid}")
        args = name ? [template_id, name] : [template_id]
        args.push('--answers', "@#{answers_path}") if answers
        args.push('--notes', "@#{notes_path}") if notes
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        sys = new(*flight_job, 'create-script', *args, '--json', *includes, **opts)
        sys.run do
          File.write answers_path, answers if answers
          File.write notes_path, notes if notes
        end
      ensure
        FileUtils.rm_f answers_path
        FileUtils.rm_f notes_path
      end

      def edit_script_notes(script_id, **opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'edit-script-notes', script_id, '--json', '--notes', '@-', *includes, **opts).run
      end

      def edit_script(script_id, **opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'edit-script', script_id, '--json', '--force', '--content', '@-', *includes, **opts).run
      end

      def delete_script(id, **opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'delete-script', id, '--json', *includes, **opts).run
      end

      def list_jobs(**opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'list-jobs', '--json', *includes, **opts).run
      end

      def info_job(id, **opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'info-job', id, '--json', *includes, **opts).run
      end

      def submit_job(script_id, **opts)
        opts = opts.dup
        includes = opts.key?(:include) ? ["--include", opts.delete(:include)] : []
        new(*flight_job, 'submit-job', script_id, '--json', *includes, **opts).run
      end

      def view_job_stdout(job_id, **opts)
        new(*flight_job, 'view-job-stdout', job_id, **opts).run
      end

      def view_job_stderr(job_id, **opts)
        new(*flight_job, 'view-job-stderr', job_id, **opts).run
      end

      def view_job_results(job_id, filename, **opts)
        new(*flight_job, 'view-job-results', job_id, filename, **opts).run
      end

      private

      def flight_job
        FlightJobScriptAPI.config.flight_job
      end
    end

    def initialize(*cmd, user:, stdin: nil, env: {})
      @cmd = cmd
      @user = user
      @stdin = stdin
      @env = {
        'PATH' => FlightJobScriptAPI.app.config.command_path,
        'HOME' => passwd.dir,
        'USER' => @user,
        'LOGNAME' => @user
      }.merge(env)
    end

    def run(&block)
      result =
        self.class.mutexes[@user].synchronize do
          FlightJobScriptAPI.logger.debug("Running subprocess (#{@user}): #{stringified_cmd}")
          sp = Subprocess.new(
            env: @env,
            logger: FlightJobScriptAPI.logger,
            timeout: FlightJobScriptAPI.config.command_timeout,
            username: @user,
          )
          sp.run(@cmd, @stdin, &block)
        end
      parse_result(result)
      log_command(result)
      result
    end

    private

    def passwd
      @passwd ||= Etc.getpwnam(@user)
    end

    def parse_result(result)
      if result.exitstatus == 0 && expect_json_response?
        begin
          unless result.stdout.nil? || result.stdout.strip == ''
            result.stdout = JSON.parse(result.stdout)
          end
        rescue JSON::ParserError
          result.exitstatus = 128
        end
      end
    end

    def expect_json_response?
      @cmd.any? {|i| i.strip == '--json'}
    end

    def log_command(result)
      FlightJobScriptAPI.logger.info <<~INFO.chomp
        COMMAND: #{stringified_cmd}
        USER: #{@user}
        PID: #{result.pid}
        STATUS: #{result.exitstatus}
      INFO
      FlightJobScriptAPI.logger.debug <<~DEBUG
        STDIN:
        #{@stdin.to_s}
        STDOUT:
        #{result.stdout}
        STDERR:
        #{result.stderr}
      DEBUG
    end

    def stringified_cmd
      @stringified_cmd ||= @cmd
        .map { |s| s.empty? ? '""' : s }.join(' ')
    end
  end
end
