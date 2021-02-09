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
  SCHEMA = JSONSchemer.schema({
    "type" => "object",
    "additionalProperties" => false,
    "required" => ['created_at', 'script_name'],
    "properties" => {
      'created_at' => { 'type' => 'string', 'format' => 'date-time' },
      'template_id' => { 'type' => 'string' },
      'script_name' => { 'type' => 'string' }
    }
  })

  # Used by the specs to change which directory to store the files in on a per
  # user basis
  def self.base_path(user)
    Etc.getpwnam(user).dir
  rescue
    FlightJobScriptAPI.logger.error "Could not locate home directory for: #{user}"
    return nil
  end

  attr_accessor :user
  attr_writer :id, :template

  validate do
    # Ensure the paths can be determined
    metadata_path
    script_path

    if metadata
      unless (schema_errors = SCHEMA.validate(metadata).to_a).empty?
        FlightJobScriptAPI.logger.error "The following metadata file is invalid: #{metadata_path}\n" do
          schema_errors.each_with_index.map do |error, index|
            "Error #{index + 1}:\n#{JSON.pretty_generate(error)}"
          end.join("\n")
        end
        errors.add(:metadata, 'is not valid')
      end
    end
  end

  validates :user, presence: true

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
    if ! @metadata.nil?
      @metadata
    elsif ! metadata_path
      @metadata = {}
    elsif @template && File.exists?(metadata_path)
      errors.add(:metadata, 'detected a template conflict')
      @metadata = {}
    elsif File.exists?(metadata_path)
      begin
        YAML.load File.read(metadata_path)
      rescue Psych::SyntaxError
        errors.add(:metadata, 'is not valid YAML')
        @metadata = {}
      end
    elsif @template
      @metadata = {
        'created_at' => DateTime.now.rfc3339,
        'template_id' => @template.id,
        'script_name' => @template.script_template_name
      }
    else
      errors.add(:template, 'no template provided')
      @metadata = {}
    end
  end

  # Allow the template to become invalid/ post creation
  def template
    if ! @template.nil?
      @template
    elsif template_id = metadata['template_id']
      candidate = Template.new(id: metadata['template_id'])
      @template = candidate.valid? ? candidate : false
    else
      @template = false
    end
  end

  def script_name
    (metadata || {})['script_name']
  end

  def script_path
    if ! @script_path.nil?
      @script_path
    elsif script_name.nil?
      @script_path = false
    elsif base = self.class.base_path(user)
      @script_path = File.join(
        base, '.local/share/flight/job-scripts', id, script_name
      )
    else
      errors.add(:script_path, "could not be determined")
      @script_path = false
    end
  end

  def metadata_path
    if ! @metadata_path.nil?
      @metadata_path
    elsif base = self.class.base_path(user)
      @metadata_path = File.join(
        base, '.local/share/flight/job-scripts', id, 'metadata.yaml'
      )
    else
      errors.add(:metadata_path, "could not be determined")
      @metadata_path =  false
    end
  end
end
