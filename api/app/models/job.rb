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

  def self.index(**opts)
    cmd = FlightJobScriptAPI::SystemCommand.flight_list_jobs(**opts).tap do |cmd|
      next if cmd.exitstatus == 0
      raise FlightJobScriptAPI::CommandError, 'Unexpectedly failed to list jobs'
    end
    JSON.parse(cmd.stdout).map do |metadata|
      new(user: opts[:user], **metadata)
    end
  end

  def self.find(id, **opts)
    cmd = FlightJobScriptAPI::SystemCommand.flight_info_job(id, **opts).tap do |cmd|
      next if cmd.exitstatus == 0
      return nil if cmd.exitstatus == 23
      raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to find job: #{id}"
    end

    new(user: opts[:user], **JSON.parse(cmd.stdout))
  end

  attr_reader :metadata, :user

  def initialize(user:, **metadata)
    @metadata = metadata
    @user = user

    # Flag that the script has not been loaded
    @script = false
  end

  # def template
  #   script&.template
  # end

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
      raise MissingScript, "Can not create a job without a script"
    end

    cmd = FlightJobScriptAPI::SystemCommand.flight_submit_job(script_id, user: user).tap do |cmd|
      next if cmd.exitstatus == 0
      if cmd.exitstatus == 22
        raise MissingScript, "Failed to locate script : #{script_id}"
      else
        raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to submit job"
      end
    end

    @metadata = JSON.parse(cmd.stdout)
  end
end
