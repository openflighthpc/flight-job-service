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
    class Loader
      def initialize(root, config_files)
        @root = root
        @config_files = Array(config_files)
      end

      def load
        merged = defaults.merge(from_config_files).merge(from_env_vars)
        Configuration.new.tap do |config|
          merged.each do |key, value|
            config.send("#{key}=", transform(key, value))
          end
        end
      rescue => e
        raise e, "Cannot load configuration:\n#{e.message}", e.backtrace
      end

      def defaults
        Configuration::ATTRIBUTES.reduce({}) do |accum, attr|
          if attr.key?(:default)
            accum[attr[:name]] = attr[:default].respond_to?(:call) ?
              attr[:default].call(@root) :
              attr[:default]
          end
          accum
        end
          .deep_transform_keys(&:to_s)
      end

      def from_config_files
        @config_files.reduce({}) do |accum, config_file|
          if config_file.exist?
            config = ( YAML.load_file(config_file) || {} ).deep_transform_keys(&:to_s)
          end
          accum.merge(config || {})
        end
      rescue ::Psych::SyntaxError => e
        raise "YAML syntax error occurred while parsing #{@config_file}. " \
          "Please note that YAML must be consistently indented using spaces. Tabs are not allowed. " \
          "Error: #{e.message}"
      end

      def from_env_vars
        Configuration::ATTRIBUTES.reduce({}) do |accum, attr|
          if attr[:env_var]
            env_var = "FLIGHT_JOB_SCRIPT_API_#{attr[:name].upcase}"
            unless ENV[env_var].nil?
              accum[attr[:name]] = ENV[env_var]
            end
          end
          accum
        end
          .deep_transform_keys(&:to_s)
      end

      def transform(key, value)
        config_definition = Configuration::ATTRIBUTES.detect do |h|
          h[:name].to_s == key.to_s
        end
        return value unless config_definition
        if config_definition[:transform]
          config_definition[:transform].call(value)
        else
          value
        end
      end
    end
  end
end
