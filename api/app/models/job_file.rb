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
      # Find the relevant files
      cmd = FlightJobScriptAPI::SystemCommand.flight_list_job_results(job_id, user: user)

      # Return nil if the job is missing
      # NOTE: This distinguishes between job's without any result files and missing jobs
      return nil if cmd.exitstatus == 23

      # Return empty array if the results directory is missing
      return [] if cmd.exitstatus == 20

      # Error if the system command otherwise failed
      unless cmd.exitstatus == 0
        raise CommandError, "Failed to load the result files for job: #{job_id}"
      end

      # Process the output from ls
      results_dir = nil
      current_dir = nil
      cmd.stdout.each_line.map do |line|
        # When flagged to do so, set the current_dir and skip the line
        if current_dir.nil?
          current_dir ||= line.sub(/:\n\Z/, '')
          results_dir ||= current_dir
          next
        end

        # Skip total lines
        next if /\Atotal \d+\Z/.match?(line)

        # Flag the next line will be the current_dir and skip
        if line == "\n"
          current_dir = nil
          next
        end

        # Split the line into its components
        # NOTE: Maxing it out as 9 fields allows for files which contain a space character
        perm, _l, _u, _g, size, _m, _d, _t, name = line.chomp.split(' ', 9)

        # Skip directories and symbolic links
        # NOTE: Following symbolic links may cause security issues if not handled with care
        #       For the time being it's best to ignore them
        next if perm.include?('d') || perm.include?('l')

        # Generate the relative path and file_id
        rel_path = Pathname.new(name).expand_path(current_dir).relative_path_from(results_dir).to_s
        file_id = Base64.urlsafe_encode64(rel_path)
        id = "#{job_id}.#{file_id}"

        # Load or build and cache a new file
        get_from_cache(id) || JobFile.new(job_id, file_id, user: user, size: size).tap do |file|
          set_in_cache(id, file)
        end
      end.reject(&:nil?)
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

  def filename
    @filename unless @filename.nil?
    # XXX: Should the actual name of stdout/stdderr be exposed?
    #      This would require running another command to load the job
    @filename = false if ['stdout', 'stderr'].include?(@file_id)
    @filename = Base64.urlsafe_decode64(@file_id)
  rescue ArgumentError
    # urlsafe_decode64 may raise ArgumentError if @file_id is invalid
    @filename = false
  end

  # Intentionally raises CommandError if the command exited NotFound (codes 20/23).
  # This is because a JobFile may be cached based on the result of a list
  # command which did not load the payload.
  #
  # As these models are already cached, the *should* exist. Thus a 50X server error
  # is more appropriate than 404.
  def payload
    if payload_command&.exitstatus == 0
      payload_command.stdout
    else
      raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to load file: #{id}"
    end
  end

  private

  def payload_command
    return @payload_command unless @payload_command.nil?
    @payload_command = if @file_id == 'stdout'
      FlightJobScriptAPI::SystemCommand.flight_view_job_stdout(@job_id, user: @user)
    elsif @file_id == 'stderr'
      FlightJobScriptAPI::SystemCommand.flight_view_job_stderr(@job_id, user: @user)
    elsif filename
      FlightJobScriptAPI::SystemCommand.flight_view_job_results(@job_id, filename, user: @user)
    else
      false
    end
  end
end
