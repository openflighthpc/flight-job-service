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
  attr_accessor :name, :extension

  # Validates the metadata file
  # TODO: Ensure the metadata conforms to a specification
  validate { metadata }

  # Validates the script
  validate do
    unless File.exists? template_path
      @errors.add(:template, "has not been saved")
    end
  end

  def metadata_path
    File.join(FlightJobAPI.config.cache_dir, 'templates', "#{name}.yaml")
  end

  def template_path
    basename = extension ? "#{name}.#{extension}.erb" : "#{name}.erb"
    File.join(FlightJobAPI.config.cache_dir, basename)
  end

  # NOTE: The metadata is intentionally cached to prevent excess file reads during
  # serialization. This cache is not intended to be reset, instead a new Template
  # instance should be initialized.
  def metadata
    @metadata ||= begin
      YAML.load(File.read(metadata_path, symbolize_names: true))
    end
  rescue Errno::ENOENT
    @errors.add(:metadata, "has not been saved")
  rescue Psych::SyntaxError
    @errors.add(:metadata, "is not valid YAML")
  end
end
