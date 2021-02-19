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

    API_VERSION = 'v0'
    class ConfigError < StandardError; end

    root_path File.expand_path('../..', __dir__)
    application_name 'flight-job-script-api'

    [
      {
        name: 'bind_address',
        env_var: true,
        default: 'tcp://127.0.0.1:921'
      },
      {
        name: 'pidfile',
        env_var: true,
        default: 'var/puma.pid',
        transform: root_path
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
        transform: root_path
      },
      {
        name: 'data_dir',
        env_var: true,
        default: 'usr/share',
        transform: root_path
      },
      {
        name: 'internal_data_dir',
        env_var: true,
        default: 'var/lib',
        transform: root_path
      },
      {
        name: 'script_dir',
        env_var: true,
        default: 'libexec',
        transform: root_path
      },
      {
        name: 'scheduler',
        env_var: true,
        default: 'slurm'
      },
      {
        name: 'command_path',
        env_var: true,
        default: '/usr/sbin:/usr/bin:/sbin:/bin'
      },
      {
        name: 'command_timeout',
        env_var: false,
        default: 5
      },
      {
        name: 'monitor_interval',
        env_var: false,
        default: 300
      },
      {
        name: 'log_level',
        env_var: true,
        default: 'info'
      },
      {
        name: 'sso_cookie_name',
        env_var: true,
        default: 'flight_web_auth',
      },
    ].each { |opt| attribute(opt[:name], **opt) }

    def auth_decoder
      @auth_decoder ||= FlightAuth::Builder.new(shared_secret_path)
    end

    def submit_script_path
      @submit_script_path ||= File.join(script_dir, scheduler, 'submit.sh')
      @submit_script_path.tap do |path|
        unless File.exists?(path)
          raise ConfigError, <<~ERROR
            The submit.sh script does not exist: #{path}
          ERROR
        end
        unless [1, 5, 7].include?(File.stat(path).mode % 10)
          raise ConfigError, <<~ERROR
            The submit.sh script must be globally executable: #{path}
          ERROR
        end
      end
    end

    def monitor_script_path
      @monitor_script_path ||= File.join(script_dir, scheduler, 'monitor.sh').tap do |path|
        unless File.exists?(path)
          raise ConfigError, <<~ERROR
            The monitor.sh script does not exist: #{path}
          ERROR
        end
        unless [1, 5, 7].include?(File.stat(path).mode % 10)
          raise ConfigError, <<~ERROR
            The monitor.sh script must be globally executable: #{path}
          ERROR
        end
      end
    end
  end
end
