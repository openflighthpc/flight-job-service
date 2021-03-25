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

class Script
  class << self
    prepend FlightJobScriptAPI::ModelCache

    def index(**opts)
      cmd = FlightJobScriptAPI::SystemCommand.flight_list_scripts(**opts).tap do |cmd|
        next if cmd.exitstatus == 0
        raise FlightJobScriptAPI::CommandError, 'Unexpectedly failed to list scripts'
      end
      JSON.parse(cmd.stdout).map do |metadata|
        new(user: opts[:user], **metadata)
      end
    end

    def find(id, **opts)
      cmd = FlightJobScriptAPI::SystemCommand.flight_info_script(id, **opts).tap do |cmd|
        next if cmd.exitstatus == 0
        return nil if cmd.exitstatus == 22
        raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to find script: #{id}"
      end

      new(user: opts[:user], **JSON.parse(cmd.stdout))
    end
  end

  attr_reader :metadata, :user

  def initialize(user:, **metadata)
    @metadata = metadata
    @user = user

    # Flag that the template has not been loaded
    @template = false
  end

  def id
    metadata['id']
  end

  def template
    if @template == false
      template_id = metadata['template_id']
      FlightJobScriptAPI.logger.info "Lazy loading related template: #{template_id} (script: #{id})"
      @template = Template.find(template_id, user: user)
    end
    @template
  end

  def delete(**opts)
    FlightJobScriptAPI::SystemCommand.flight_delete_script(id, **opts).tap do |cmd|
      next if cmd.exitstatus == 0
      raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to delete script: #{id}"
    end
  end
end
