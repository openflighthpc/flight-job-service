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

class Script < ApplicationModel
  attr_accessor :template, :unix_timestamp, :user
  attr_writer :path

  # NOTE: The script ID is not technically globally unique. Instead it is
  # unique for a given user. This currently works as user's can not access
  # each other's scripts. Review if required
  def id
    "#{template.id}-#{unix_timestamp}"
  end

  # Used to generate the rendered context. Used by the specs to bypass file
  # permission issues
  def render(**answers)
    FlightJobScriptAPI::RenderContext.new(
      template: template, answers: answers
    ).render
  end

  # XXX: Eventually the answers will likely be saved with the script
  def render_and_save(**answers)
    content = render(**answers)
    FileUtils.mkdir_p File.dirname(path)
    File.write(path, content)
    FileUtils.chmod(0700, path)
    FileUtils.chown(user, user, path)
  rescue
    FlightJobScriptAPI.logger.error("Failed to render: #{template.template_path}")
    FlightJobScriptAPI.logger.debug("Full render error:") do
      $!.full_message
    end
    raise $!
  end

  # Infer the path from the template and user's home directory
  # NOTE: Maybe overridden in the constructor to ensure existing template paths
  # are not modified
  def path
    @path ||= File.expand_path(File.join(
      base_path, '.local/share/flight/job-scripts', template.id,
      "#{template.script_template_name}-#{unix_timestamp}"
    ))
  end

  private

  # Helper method for determining the home directory of the user's
  # NOTE: This method is stubbed in the specs to allow for missing user's
  def base_path
    @base_path ||= Etc.getpwnam(user).dir
  end
end
