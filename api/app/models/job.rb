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

class Job
  class MissingScript < StandardError; end

  class << self
    prepend FlightJobScriptAPI::ModelCache

    def index(**opts)
      cmd = FlightJobScriptAPI::JobCLI.list_jobs(**opts).tap do |cmd|
        next if cmd.exitstatus == 0
        raise FlightJobScriptAPI::CommandError, 'Unexpectedly failed to list jobs'
      end
      cmd.stdout.map do |metadata|
        new(user: opts[:user], **metadata)
      end
    end

    def find(id, **opts)
      find!(id, **opts)
    rescue FlightJobScriptAPI::CommandError
      nil
    end

    def find!(id, **opts)
      cmd = FlightJobScriptAPI::JobCLI.info_job(id, **opts).tap do |cmd|
        next if cmd.exitstatus == 0
        return nil if cmd.exitstatus == 23
        raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to find job: #{id}"
      end

      new(user: opts[:user], **cmd.stdout)
    end
  end

  attr_reader :metadata, :user

  def initialize(user:, **metadata)
    @metadata = metadata
    @user = user

    # Flag that the script has not been loaded
    @script = false
  end

  def id
    metadata['id']
  end

  def script_id
    metadata['script_id']
  end

  def script_id=(id)
    @script = false
    metadata['script_id'] = id
  end

  def script
    if @script == false
      script_id = metadata['script_id']
      FlightJobScriptAPI.logger.info "Lazy loading related script: #{script_id} (script: #{id})"
      @script = Script.find(script_id, user: user)
    end
    @script
  end

  def submit
    unless script_id
      raise MissingScript, "Cannot create a job without a script"
    end

    cmd = FlightJobScriptAPI::JobCLI.submit_job(script_id, user: user).tap do |cmd|
      next if cmd.exitstatus == 0
      if cmd.exitstatus == 22
        raise MissingScript, "Failed to locate script : #{script_id}"
      else
        raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to submit job"
      end
    end

    @metadata = cmd.stdout
  end

  def index_result_files
    JobFile.index_job_results(self.id, user: user)
  end

  def index_output_files
    [ find_stdout_file, find_stderr_file ].compact
  end

  def stderr_merged?
    paths = metadata.slice('stdout_path', 'stderr_path').values.uniq
    return nil if paths.length == 1 && paths.first.nil?
    paths.length == 1
  end

  def find_stdout_file
    JobFile.find("#{id}.stdout", user: user)
  end

  def find_stderr_file
    return nil if stderr_merged?
    JobFile.find("#{id}.stderr", user: user)
  end

  def cache_related_resources
    if script_data = metadata['script']
      Script.cache(user: user, **script_data)
    end

    if files_data = metadata['result_files']
      files_data.each do |opts|
        file = opts['file']
        size = opts['size']
        file_id = JobFile.generate_file_id(metadata['results_dir'], file)
        JobFile.cache(id, file_id, user: user, size: size)
      end
    end

    # NOTE: This pre-populates the stdout/stderr files in the cache
    # and bypasses the existence check on 'find'
    if stdout_size = metadata['stdout_size']
      JobFile.cache(id, 'stdout', user: user, size: stdout_size)
    end

    if stderr_size = metadata['stderr_size']
      JobFile.cache(id, 'stderr', user: user, size: stderr_size)
    end
  end
end
