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

require 'base64'
module FlightJobScriptAPI
  module PamAuth
    # Returns true, false, or nil:
    # * true: The username/password are valid
    # * false: The username/password were decoded but are otherwise invalid
    # * nil: An error occurred whilst decoding the header
    def self.valid?(header)
      return nil unless header
      match = /\ABasic (.*)\Z/.match(header)
      return nil unless match
      encoded = match[1]
      return nil unless encoded
      username, password = Base64.decode64(encoded).split(':', 2)
      return nil if password.nil?
      Rpam.auth(username.to_s, password.to_s, service: FlightJobScriptAPI.config.pam_service)
    end
  end
end
