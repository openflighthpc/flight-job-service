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
  METADATA_KEYS = ['exitstatus', 'stdout', 'stderr', 'script_id', 'created_at', 'scheduler_id']

  SUBMIT_RESPONSE_SCHEMA = JSONSchemer.schema({
    "type" => "object",
    "additionalProperties" => false,
    "required" => ["id"],
    "properties" => {
      "id" => { "type" => "string" },
      "status" => { "status" => "string" }
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

  attr_reader :script
  attr_accessor :id, :user, *METADATA_KEYS

  validates :id, :user, presence: true

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
    if @script
      errors.add(:script, 'can not be changed')
    else
      @script_id = script.id
      @script = script
    end
  end

  def metadata_path
    @metadata_path ||= self.class.metadata_path(user, id)
  end

  def to_h
    METADATA_KEYS.map { |k| [k, send(k)] }.to_h
  end

  def submit
    # Establish pipes for stdout/stderr
    # NOTE: Must be first due to the ensure block
    out_read, out_write = IO.pipe
    err_read, err_write = IO.pipe

    self.class.mutexes[id].synchronize do
      # Persist the job
      FileUtils.mkdir_p File.dirname(metadata_path)
      File.write metadata_path, YAML.dump(to_h)

      # Launch the submission process
      pid = Kernel.fork do
        # Close the read pipes
        out_read.close
        err_read.close

        # Establish the command
        cmd = [
          FlightJobScriptAPI.config.submit_script_path,
          script.script_path
        ]
        FlightJobScriptAPI.logger.info("Submitting Job: #{id}")
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
        Kernel.exec(env, *cmd, unsetenv_others: true, close_others: true,
                    chdir: passwd.dir, out: out_write, err: err_write)
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

      # set the status/stdout/stderr
      self.exitstatus = status.exitstatus
      self.stdout = out_read.read
      self.stderr = err_read.read

      # Parse the STDOUT if exited zero
      if self.exitstatus == 0
        begin
          data = JSON.parse(self.stdout.split("\n").last)
          errors = SUBMIT_RESPONSE_SCHEMA.validate(data).to_a
          if errors.empty?
            self.scheduler_id = data['id']
          else
            FlightJobScriptAPI.logger.error "The job output is invalid: #{id}" do
              JSON.pretty_generate(errors)
            end
          end
        rescue
          FlightJobScriptAPI.logger.error "Failed to parse the output for job: #{id}"
          FlightJobScriptAPI.logger.debug($!.message)
        end
      end

      # Save the metadata
      File.write(metadata_path, YAML.dump(to_h))
    end
  ensure
    out_read.close unless out_read.closed?
    out_write.close unless out_write.closed?
    err_read.close unless err_read.closed?
    err_write.close unless err_write.closed?
  end
end
