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

class Template < ApplicationModel
  METADATA_SCHEMA = JSONSchemer.schema({
    "type" => "object",
    # NOTE: Should the validation be this strict? The serializer hard codes the
    # expected keys, so extraneous details will be ignored.
    #
    # The strict validation is ok for now, but may cause usability issues when
    # switching back and forth between different versions.
    "additionalProperties" => false,
    "required" => [:synopsis, :version],
    "properties" => {
      synopsis: { "type" => 'string' },
      description: { "type" => 'string' },
      version: { "type" => 'integer', 'enum' => [0] }
    }
  })

  FORMAT_SPEC = {
    "type" => "object",
    "additionalProperties" => false,
    "required" => [:type],
    "properties" => {
      type: { "type" => "string" },
      options: {
        "type" => "array",
        "items" => {
          "type" => "object",
          "additionalProperties" => false,
          "required" => [:text, :value],
          "properties" => {
            text: { "type" => "string" },
            value: { "type" => "string" }
          }
        }
      }
    }
  }

  ASK_WHEN_SPEC = {
    "type" => "object",
    "additionalProperties" => false,
    "required" => [:value, :eq],
    "properties" => {
      value: { "type" => "string" },
      eq: { "type" => "string" }
    }
  }

  QUESTIONS_SCHEMA = JSONSchemer.schema({
    "type" => "array",
    "items" => {
      "type" => "object",
      "additionalProperties" => false,
      "required" => [:id, :text],
      "properties" => {
        id: { 'type' => 'string' },
        text: { 'type' => 'string' },
        description: { 'type' => 'string' },
        # NOTE: Forcing the default to be a string is a stop-gap measure
        # It keeps the initial implementation simple as everything is a strings
        # Eventually multiple formats will be supported
        default: { 'type' => 'string' },
        format: FORMAT_SPEC,
        ask_when: ASK_WHEN_SPEC
      }
    }
  })

  attr_accessor :name, :extension

  def self.from_id(id)
    name, ext = id.split('.', 2)
    Template.new(name: name, extension: ext)
  end

  # Validates the metadata and questions file
  validate do
    if metadata_file_content
      unless (metadata_errors = METADATA_SCHEMA.validate(metadata).to_a).empty?
        FlightJobScriptAPI.logger.error "The following file has invalid metadata: #{metadata_path}" do
          JSON.pretty_generate(metadata_errors)
        end
        @errors.add(:metadata, 'is not valid')
      end

      unless (questions_errors = QUESTIONS_SCHEMA.validate(questions_data).to_a).empty?
        FlightJobScriptAPI.logger.error "The following file has invalid questions: #{metadata_path}" do
          JSON.pretty_generate(questions_errors)
        end
        @errors.add(:questions, 'is not valid')
      end
    end
  end

  # Validates the script
  validate do
    unless File.exists? template_path
      @errors.add(:template, "has not been saved")
    end
  end

  def id
    extension ? "#{name}.#{extension}" : name
  end

  def metadata_path
    File.join(FlightJobScriptAPI.config.data_dir, "#{name}.yaml")
  end

  def template_path
    basename = extension ? "#{name}.#{extension}.erb" : "#{name}.erb"
    File.join(FlightJobScriptAPI.config.data_dir, basename)
  end

  def render_template(**context)
    bind = OpenStruct.new(**context).instance_exec { binding }
    template = File.read(template_path)
    ERB.new(template, nil, '-').result(bind)
  end

  def attachment_name
    File.basename(template_path).chomp('.erb')
  end

  def metadata
    return {} if metadata_file_content.nil?
    metadata_file_content[:metadata]
  end

  def questions_data
    return [] if metadata_file_content.nil?
    metadata_file_content[:questions]
  end

  def questions
    @questions ||= questions_data.map do |datum|
      Question.new(**datum)
    end
  end

  private

  # NOTE: The metadata is intentionally cached to prevent excess file reads during
  # serialization. This cache is not intended to be reset, instead a new Template
  # instance should be initialized.
  def metadata_file_content
    @metadata_file_content ||= begin
      YAML.load(File.read(metadata_path), symbolize_names: true).to_h
    end
  rescue Errno::ENOENT
    @errors.add(:metadata, "has not been saved")
    nil
  rescue Psych::SyntaxError
    @errors.add(:metadata, "is not valid YAML")
    nil
  end
end
