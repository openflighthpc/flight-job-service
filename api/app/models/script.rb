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
  # Used by the specs to change which directory to store the files in on a per
  # user basis
  def self.base_path(user)
    Etc.getpwnam(user).dir
  end

  attr_accessor :user
  attr_writer :id, :template

  def id
    @id ||= SecureRandom.uuid
  end

  # XXX: Eventually the answers will likely be saved with the script
  def render_and_save(**answers)
    content = FlightJobScriptAPI::RenderContext.new(
      template: template, answers: answers
    ).render

    # Writes the data to disk
    FileUtils.mkdir_p File.dirname(metadata_path)
    File.write(metadata_path, YAML.dump(metadata))
    File.write(script_path, content)

    # Disable chown within tests as the user may not exist
    unless ENV['RACK_ENV'] == 'test'
      FileUtils.chown(user, user, script_path)
      FileUtils.chown(user, user, metadata_path)
    end

    # Makes the script executable and metadata read/write
    FileUtils.chmod(0700, script_path)
    FileUtils.chmod(0600, metadata_path)
  rescue
    FlightJobScriptAPI.logger.error("Failed to render: #{template.template_path}")
    FlightJobScriptAPI.logger.debug("Full render error:") do
      $!.full_message
    end
    raise $!
  end

  def metadata
    @metadata ||= if File.exists?(metadata_path)
      # Prevent inconsistency in the template
      raise 'An unexpected error has occurred' if @template

      YAML.load File.read(metadata_path)
    elsif @template
      {
        'created_at' => Time.now,
        'template_id' => @template.id,
        'script_name' => @template.script_template_name
      }
    else
      raise 'An unexpected error has occurred!'
    end
  end

  # Allow the template to become invalid/ post creation
  def template
    @template ||= begin
      candidate = Template.new(id: metadata['template_id'])
      candidate.valid? ? candidate : nil
    end
  end

  def script_name
    metadata['script_name']
  end

  def script_path
    @script_path ||= File.join(
      self.class.base_path(user), '.local/share/flight/job-scripts', id, script_name
    )
  end

  def metadata_path
    @metadata_path ||= File.join(
      self.class.base_path(user), '.local/share/flight/job-scripts', id, 'metadata.yaml'
    )
  end
end
