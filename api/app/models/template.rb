# frozen_string_literal: true
#==============================================================================
# Copyright (C) 2021-present Alces Flight Ltd.
#
# This file is part of Flight Job Service.
#
# This program and the accompanying materials are made available under
# the terms of the Eclipse Public License 2.0 which is available at
# <https://www.eclipse.org/legal/epl-2.0>, or alternative license
# terms made available by Alces Flight Ltd - please direct inquiries
# about licensing to licensing@alces-flight.com.
#
# Flight Job Service is distributed in the hope that it will be useful, but
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR
# IMPLIED INCLUDING, WITHOUT LIMITATION, ANY WARRANTIES OR CONDITIONS
# OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY OR FITNESS FOR A
# PARTICULAR PURPOSE. See the Eclipse Public License 2.0 for more
# details.
#
# You should have received a copy of the Eclipse Public License 2.0
# along with Flight Job Service. If not, see:
#
#  https://opensource.org/licenses/EPL-2.0
#
# For more information on Flight Job Service, please visit:
# https://github.com/openflighthpc/flight-job-service
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
    "required" => [:synopsis],
    "properties" => {
      synopsis: { "type" => 'string' },
      details: { "type" => 'string' }
    }
  })

  attr_accessor :name, :extension

  def self.from_id(id)
    name, ext = id.split('.', 2)
    Template.new(name: name, extension: ext)
  end

  # Validates the metadata file
  validate do
    if metadata_file_content
      METADATA_SCHEMA.validate(metadata).to_a.each do |error|
        @errors.add(:metadata, JSON.pretty_generate(error))
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
    File.join(FlightJobAPI.config.cache_dir, "#{name}.yaml")
  end

  def template_path
    basename = extension ? "#{name}.#{extension}.erb" : "#{name}.erb"
    File.join(FlightJobAPI.config.cache_dir, basename)
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
    metadata_file_content[:metadata]
  end

  private

  # NOTE: The metadata is intentionally cached to prevent excess file reads during
  # serialization. This cache is not intended to be reset, instead a new Template
  # instance should be initialized.
  def metadata_file_content
    @metadata_file_content ||= begin
      YAML.load(File.read(metadata_path, symbolize_names: true)).to_h
    end
  rescue Errno::ENOENT
    @errors.add(:metadata, "has not been saved")
    nil
  rescue Psych::SyntaxError
    @errors.add(:metadata, "is not valid YAML")
    nil
  end
end
