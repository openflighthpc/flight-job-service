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

class JobFile
  class << self
    prepend FlightJobScriptAPI::ModelCache

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
  def initialize(job_id, file_id, user:)
    @job_id = job_id
    @file_id = file_id
    @user = user
  end

  def id
    "#{@job_id}.#{@file_id}"
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
