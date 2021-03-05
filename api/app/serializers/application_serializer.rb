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

class ApplicationSerializer
  include JSONAPI::Serializer

  # Include the 'data' hash for has_one relationships by default
  # NOTE: This is only the resource identifier object NOT the entire related
  # resource. This provides the ID to the client without using an 'include'
  #
  # PS: has_many is still excluded because typically work is required to generate
  # the IDs. The client needs to request these explicitly
  def self.has_one(*a, include_data: true, **o)
    super
  end

  def format_name(attribute_name)
    attribute_name.to_s.camelize(:lower)
  end

  def base_url
    File.join(FlightJobScriptAPI.config.base_url, FlightJobScriptAPI::Configuration::API_VERSION)
  end

  def relationship_self_link(attribute_name)
    nil
  end
end
