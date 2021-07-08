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

require 'pathname'

class JobFile
  class << self
    prepend FlightJobScriptAPI::ModelCache

    def generate_file_id(results_dir, file_path)
      Base64.urlsafe_encode64 Pathname.new(file_path).relative_path_from(results_dir).to_s
    end

    # NOTE: There is a bit of back and forth between Job and JobFile here
    #       This is due to how the 'includes' was retrofitted over the original implementation
    #       Consider refactoring
    def index_job_results!(job_id, user:)
      # Attempt to load the cached version of Job
      job = Job.find!(job_id, user: user)

      # Fetch the files
      (job.metadata['result_files'] || []).map do |data|
        # NOTE: 'results_dir' must be set otherwise the files would be empty
        file_id = generate_file_id(job.metadata['results_dir'], data['file'])
        id = "#{job.id}.#{file_id}"
        find!(id, user: user)
      end
    end

    def index_job_results(job_id, user:)
      index_job_results!(job_id, user: user)
    rescue FlightJobScriptAPI::CommandError
      nil
    end

    def find!(id, **opts)
      job_id, file_id = id.split('.', 2)
      new(job_id, file_id, user: opts[:user]).tap do |job_file|
        return nil unless job_file.exists?
      end
    end

    def find(id, **opts)
      find!(id, **opts)
    rescue FlightJobScriptAPI::CommandError
      nil
    end
  end

  # NOTE: The file_id could be one of the following:
  # * 'stdout' - Denotes the standard output,
  # * 'stderr' - Denotes the standard error], or
  # * 'encoded_string' - The relative path to the file as a urlsafe base64 encoded string
  #
  # PS: The strings 'stdout'/'stderr' are invalid inputs to urlsafe_decode64 and thus
  # can be used as special case inputs.
  def initialize(job_id, file_id, user:, size: nil)
    @job_id = job_id
    @file_id = file_id
    @user = user
    @size = size
  end

  def id
    "#{@job_id}.#{@file_id}"
  end

  # NOTE: The size maybe cached from the ls command, which allows the payload
  # to be lazy loaded. However the size should be recalculated if the payload
  # is being sent with the request.
  #
  # This edge case *may* happen surprisingly often as it is possible to retrieve
  # files of a RUNNING command.
  #
  # Doing the recalculation implicitly is not an option because it makes the
  # serializer order dependent. Explicit recalculation prevents this.
  def size(recalculate: false)
    @size = nil if recalculate
    @size ||= payload.length
  end

  # Checks the file exists and the user has permission to access it
  #
  # NOTE: This method may raise CommandError.
  def exists?
    return false unless path
    return false unless File.exists?(path)
    # NOTE: The permission check prevents malicious user's querying the
    # filesystem.
    is_readable?
  end

  def find_job
    Job.find!(@job_id, user: @user)
  end

  def relative_path
    decoded_file_id
    # XXX Add back support for 'stdout' and 'stderr'.  It needs to not break
    # for jobs that have not reported their results dir.
    # return @relative_path unless @relative_path.nil?
    # @relative_path = if ['stdout', 'stderr'].include?(@file_id) && path
    #   Pathname.new(path).relative_path_from(find_job.metadata['results_dir']).to_s
    # else
    #   decoded_file_id
    # end
  end

  def decoded_file_id
    return @decoded_file_id unless @decoded_file_id.nil?
    return @decoded_file_id = false if ['stdout', 'stderr'].include?(@file_id)
    @decoded_file_id = Base64.urlsafe_decode64(@file_id)
  rescue ArgumentError
    # urlsafe_decode64 may raise ArgumentError if @file_id is invalid
    @decoded_file_id = false
  end

  def path
    return @path unless @path.nil?
    case @file_id
    when 'stdout'
      @path = find_job.metadata['stdout_path']
    when 'stderr'
      @path = find_job.metadata['stderr_path']
    else
      results_dir = find_job.metadata['results_dir']
      if results_dir && decoded_file_id
        @path = File.join(results_dir, decoded_file_id)
      else
        @path = false
      end
    end
  end

  def filename
    @path ? File.basename(path) : nil
  end

  # Intentionally raises CommandError if the file is not loadable.
  # This is because a JobFile may be cached based on the result of a list
  # command which did not load the payload.
  #
  # As these models are already cached, the *should* exist. Thus a 50X server error
  # is more appropriate than 404.
  def payload
    return @payload if @payload

    unless exists?
      raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to read file: #{id}"
    end
    @payload = File.read path
  end

  protected

  def <=>(other)
    filename <=> other.filename
  end

  # Confirm the user has permission to access the file.
  #
  # We directly check the file permissions here to avoid launching a new
  # `flight job` command
  def is_readable?
    logger = FlightJobScriptAPI.logger
    logger.debug("Checking file is readable: id:#{id.inspect} path:#{path.inspect} user:#{@user.inspect}")
    sp = FlightJobScriptAPI::Subprocess.new(
      env: {},
      logger: logger,
      timeout: FlightJobScriptAPI.config.command_timeout,
      username: @user,
    )
    result = sp.run(nil, nil) do
      exit(20) unless File.exists?(path)
      File.stat(path).readable? ? exit(0) : exit(20)
    end
    logger.debug("Checked file is readable: id:#{id.inspect} path:#{path.inspect} user:#{@user.inspect} exitstatus:#{result.exitstatus}; pid=#{result.pid}")
    case result.exitstatus
    when 0
      true
    when 20
      false
    else
      # We really shouldn't ever end up here.
      raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to determine if the file exists: #{id}"
    end
  end
end
