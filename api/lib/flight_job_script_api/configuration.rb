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

module FlightJobScriptAPI
  class Configuration
    extend FlightConfiguration::RackDSL

    root_path File.expand_path('../..', __dir__)
    application_name 'flight-job-script-api'
    API_VERSION = 'v0'

    class ConfigError < StandardError; end

    [
      {
        name: 'bind_address',
        env_var: true,
        default: 'tcp://127.0.0.1:921'
      },
      {
        name: 'base_url',
        env_var: true,
        default: '/'
      },
      {
        name: 'shared_secret_path',
        env_var: true,
        default: 'etc/shared-secret.conf',
        transform: relative_to(root_path)
      },
      {
        name: 'flight_job',
        env_var: true,
        default: File.join(ENV.fetch('flight_ROOT', '/opt/flight'), 'bin/flight job'),
        transform: ->(value) { value.split(' ') }
      },
      {
        name: 'command_path',
        env_var: true,
        default: '/usr/sbin:/usr/bin:/sbin:/bin'
      },
      {
        name: 'command_timeout',
        env_var: true,
        default: 5,
        transform: :to_f
      },
      {
        name: 'log_level',
        env_var: true,
        default: 'info'
      },
      {
        name: 'sso_cookie_name',
        env_var: true,
        default: 'flight_login',
      },
    ].each { |opt| attribute(opt[:name], **opt) }

    def auth_decoder
      @auth_decoder ||= FlightAuth::Builder.new(shared_secret_path)
    end
  end
end
