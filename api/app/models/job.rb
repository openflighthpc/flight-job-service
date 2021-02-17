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
  TERMINAL_STATES = ['FAILED', 'COMPLETED', 'CANCELLED', 'UNKNOWN']
  STATES = ['PENDING_SUBMISSION', 'PENDING', 'RUNNING', *TERMINAL_STATES]

  METADATA_KEYS = [
    'exitstatus', 'submit_stdout', 'submit_stderr', 'script_id', 'created_at',
    'scheduler_id', 'stdout_path', 'stderr_path', 'state', 'reason', "start_time", "end_time"
  ]

  SUBMIT_RESPONSE_SCHEMA = JSONSchemer.schema({
    "type" => "object",
    "additionalProperties" => false,
    "required" => ["id", "stdout", "stderr"],
    "properties" => {
      "id" => { "type" => "string" },
      "stdout" => { "type" => "string" },
      "stderr" => { "type" => "string" }
    }
  })

  MONITOR_RESPONSE_SCHEMA = JSONSchemer.schema({
    "type" => "object",
    "additionalProperties" => false,
    "required" => ["state"],
    "properties" => {
      "state" => { "type" => "string" },
      "reason" => { "type" => ["string", "null"] },
      "start_time" => { "type" => ["string", "null"], "format" => "date-time" },
      "end_time" => { "type" => ["string", "null"], "format" => "date-time" }
    }
  })

  def self.mutexes
    @mutexes ||= Hash.new { |h, k| h[k] = Mutex.new }
  end

  def self.metadata_path(user, id)
    File.join(FlightJobScriptAPI.config.internal_data_dir, user, id, 'metadata.yaml')
  end

  def self.from_metadata_path(path)
    unless File.exists? path
      FlightJobScriptAPI.logger.error "Failed to locate job metadata path: #{path}"
      return nil
    end
    match = match_regex.match(path)

    if match.nil?
      FlightJobScriptAPI.logger.error "Failed to parse job metadata path: #{path}"
      return nil
    end

    data = (YAML.load(File.read(path)) || {}).slice(*METADATA_KEYS)
    job = new(
      user: match['user'],
      id: match['id'],
      **data.map { |k, v| [k.to_sym, v] }.to_h
    )

    # Ensure the job is valid
    if job.valid?
      job
    else
      FlightJobScriptAPI.logger.error "A validation error occurred when loading job: #{path}"
      FlightJobScriptAPI.logger.debug(job.full_messages)
      return nil
    end
  end

  def self.match_regex
    @match_regex ||= Regexp.new(
      metadata_path('(?<user>[^/]+)', '(?<id>[^/]+)')
    )
  end

  def self.active_path(user, id)
    File.expand_path('../active', metadata_path(user, id))
  end

  def self.from_active_path(path)
    metadata_path = File.expand_path('../metadata.yaml', path)
    from_metadata_path(metadata_path)
  end

  attr_reader :script
  attr_accessor :id, :user, *METADATA_KEYS

  validates :id, :user, presence: true

  # Only monitor jobs with a scheduler_id in a non-terminal state
  validates :scheduler_id, presence: true, on: :monitor
  validates :state, on: :monitor, exclusion: {
    in: TERMINAL_STATES, message: 'can not monitor terminal jobs'
  }

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

  def submitted?
    File.exists? metadata_path
  end

  def successful?
    ! scheduler_id.nil?
  end

  def script=(script)
    if @script_id
      errors.add(:script, 'can not be changed')
    else
      @script_id = script.id
      @script = script
    end
  end

  def state=(input)
    if STATES.include?(input)
      @state = input
    else
      FlightJobScriptAPI.logger.error("Received unknown state: #{input} (job: #{id})")
      @state = 'UNKNOWN'
    end
  end

  def metadata_path
    @metadata_path ||= self.class.metadata_path(user, id)
  end

  def to_h
    METADATA_KEYS.map { |k| [k, send(k)] }.to_h
  end

  def submit
    self.class.mutexes[id].synchronize do
      # Persist the job
      self.state = 'PENDING_SUBMISSION'
      FileUtils.mkdir_p File.dirname(metadata_path)
      File.write metadata_path, YAML.dump(to_h)

      FlightJobScriptAPI.logger.info("Submitting Job: #{id}")
      cmd = [
        FlightJobScriptAPI.config.submit_script_path,
        script.script_path
      ]

      execute_command(*cmd) do |status, out, err|
        # set the status/stdout/stderr
        self.exitstatus = status.exitstatus
        self.submit_stdout = out
        self.submit_stderr = err

        # Parser stdout on successful commands
        process_output('submit', status, out) do |data|
          self.scheduler_id = data['id']
          self.stdout_path = data['stdout']
          self.stderr_path = data['stderr']
        end

        # Save the metadata
        File.write(metadata_path, YAML.dump(to_h))
      end
    end

    # Start the monitor or flag the job as failed if not terminal
    if valid?(:monitor)
      monitor
    elsif ! TERMINAL_STATES.include?(self.state)
      self.class.mutexes[id].synchronize do
        self.state = 'FAILED'
        File.write(metadata_path, YAML.dump(to_h))
      end
    end
  end

  def monitor
    FlightJobScriptAPI.logger.info("Monitoring Job: #{id}")
    cmd = [FlightJobScriptAPI.config.monitor_script_path, scheduler_id]
    execute_command(*cmd) do |status, stdout, stderr|
      process_output('monitor', status, stdout) do |data|
        self.class.mutexes[id].synchronize do
          self.state = data['state']
          self.start_time = data['start_time'] if data['start_time']
          self.end_time = data['end_time'] if data['end_time']
          if data['reason'] == ''
            self.reason = nil
          elsif data['reason']
            self.reason = data['reason']
          end
          File.write(metadata_path, YAML.dump(to_h))
        end
      end
    end
  ensure
    active_path = self.class.active_path(user, id)
    if TERMINAL_STATES.include?(self.state)
      FileUtils.rm_f active_path
    else
      FileUtils.touch active_path
    end
  end

  private

  def process_output(type, status, out)
    schema = case type
             when 'submit'
               SUBMIT_RESPONSE_SCHEMA
             when 'monitor'
               MONITOR_RESPONSE_SCHEMA
             else
               raise UnexpectedError, "Unknown command type: #{type}"
             end

    if status.success?
      string = out.split("\n").last
      begin
        data = JSON.parse(string)
        errors = schema.validate(data).to_a
        if errors.empty?
          yield(data) if block_given?
        else
          FlightJobScriptAPI.logger.error("Invalid #{type} response for job: #{id}")
          FlightJobScriptAPI.logger.debug(JSON.pretty_generate(errors))
        end
      rescue JSON::ParserError
        FlightJobScriptAPI.logger.error("Failed to parse #{type} JSON for job: #{id}")
        FlightJobScriptAPI.logger.debug($!.message)
      end
    else
      FlightJobScriptAPI.logger.error("Failed to #{type} job: #{id}")
    end
  end

  def execute_command(*cmd)
    # Establish pipes for stdout/stderr
    # NOTE: Must be first due to the ensure block
    out_read, out_write = IO.pipe
    err_read, err_write = IO.pipe

    # Launch the submission process
    pid = Kernel.fork do
      # Close the read pipes
      out_read.close
      err_read.close

      # Become the user
      passwd = Etc.getpwnam(user)
      Process::Sys.setgid(passwd.gid)
      Process::Sys.setuid(passwd.uid)
      Process.setsid

      # Execute the command
      FlightJobScriptAPI.logger.info("Executing: #{cmd.join(' ')}")
      env = {
        'PATH' => FlightJobScriptAPI.app.config.command_path,
        'HOME' => passwd.dir,
        'USER' => user,
        'LOGNAME' => user
      }
      Bundler.with_unbundled_env do
        Kernel.exec(env, *cmd, unsetenv_others: true, close_others: true,
                    chdir: passwd.dir, out: out_write, err: err_write)
      end
    end

    # Close the write pipes
    out_write.close
    err_write.close

    # Run the command
    begin
      _, status = Timeout.timeout(FlightJobScriptAPI.app.config.command_timeout) do
        Process.wait2(pid)
      end
    rescue Timeout::Error
      Process.kill('TERM', pid)
      retry
    end

    cmd_stdout = out_read.read
    cmd_stderr = err_read.read

    FlightJobScriptAPI.logger.debug <<~DEBUG
      STATUS: #{status.exitstatus}
      STDOUT:
      #{cmd_stdout}
      STDERR:
      #{cmd_stderr}
    DEBUG

    yield(status, cmd_stdout, cmd_stderr)
  ensure
    out_read.close unless out_read.closed?
    out_write.close unless out_write.closed?
    err_read.close unless err_read.closed?
    err_write.close unless err_write.closed?
  end
end
