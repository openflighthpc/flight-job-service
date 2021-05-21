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

    def index_job_results!(job_id, user:)
      # Load up the job
      job = Job.find!(job_id, user: user)
      return nil unless job
      return nil unless job.metadata['results_dir']
      results_dir = job.metadata['results_dir']

      # Find the relevant files
      cmd = FlightJobScriptAPI::SystemCommand.recursive_glob_dir(results_dir, user: user)

      # Return empty array if the results directory is missing
      return [] if cmd.exitstatus == 20

      # Error if the system command otherwise failed
      unless cmd.exitstatus == 0
        raise CommandError, "Failed to load the result files for job: #{job_id}"
      end

      # Construct the files
      JSON.parse(cmd.stdout).map do |payload|
        file = payload['file']
        size = payload['size']
        file_id = Base64.urlsafe_encode64 Pathname.new(file).relative_path_from(results_dir).to_s
        JobFile.new(job.id, file_id, user: user, size: size)
      end
    end

    def find!(id, **opts)
      job_id, file_id = id.split('.', 2)
      new(job_id, file_id, user: opts[:user]).tap do |job_file|
        return nil unless job_file.exists?
      end
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

  def exists?
    payload # Attempts to load the payload
    true
  rescue FlightJobScriptAPI::CommandError
    # The file does not exists due to a bad name
    return false unless payload_command

    # The file or job legitimately does not exist
    return false if [20, 23].include? payload_command.exitstatus

    # Something else has gone wrong, re-raise the error
    raise $!
  end

  def find_job
    Job.find!(@job_id, user: @user)
  end

  def relative_path
    return @relative_path unless @relative_path.nil?
    @relative_path = if ['stdout', 'stderr'].include?(@file_id) && path
      Pathname.new(path).relative_path_from(find_job.metadata['results_dir']).to_s
    else
      decoded_file_id
    end
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

  # Intentionally raises CommandError if the command exited NotFound (codes 20/23).
  # This is because a JobFile may be cached based on the result of a list
  # command which did not load the payload.
  #
  # As these models are already cached, the *should* exist. Thus a 50X server error
  # is more appropriate than 404.
  def payload
    if payload_command && payload_command.exitstatus == 0
      payload_command.stdout
    else
      raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to load file: #{id}"
    end
  end

  protected

  def <=>(other)
    filename <=> other.filename
  end

  private

  def payload_command
    return @payload_command unless @payload_command.nil?
    @payload_command = if @file_id == 'stdout'
      FlightJobScriptAPI::SystemCommand.flight_view_job_stdout(@job_id, user: @user)
    elsif @file_id == 'stderr'
      FlightJobScriptAPI::SystemCommand.flight_view_job_stderr(@job_id, user: @user)
    elsif decoded_file_id
      FlightJobScriptAPI::SystemCommand.flight_view_job_results(@job_id, decoded_file_id, user: @user)
    else
      false
    end
  end
end
