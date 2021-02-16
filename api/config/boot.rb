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

if defined?(Puma)
  env = Puma.cli_config.environment
  ENV['RACK_ENV'] ||= env.respond_to?(:call) ? env.call : env
else
  ENV['RACK_ENV'] ||= 'development'
end
ENV['BUNDLE_GEMFILE'] ||= File.expand_path('../Gemfile', __dir__)

require 'rubygems'
require 'bundler'
require 'yaml'
require 'json'
require 'pathname'
require 'ostruct'
require 'erb'
require 'etc'
require 'timeout'
require 'logger'
require 'delegate'

if ENV['RACK_ENV'] == 'development'
  Bundler.require(:default, :development)
else
  Bundler.require(:default)
end

# Shared activesupport libraries
require 'active_support/core_ext/hash/keys'

# Ensure ApplicationModel::ValidationError is defined in advance
require 'active_model/validations.rb'

lib = File.expand_path('../lib', __dir__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)

require 'flight_job_script_api'

# Ensure the cache directory can only be opened by the server process owner
if Dir.exists? FlightJobScriptAPI.config.internal_data_dir
  FileUtils.chmod(0700, FlightJobScriptAPI.config.internal_data_dir)
else
  FileUtils.mkdir_p(FlightJobScriptAPI.config.internal_data_dir, mode: 0700)
end

# Ensures the shared secret exists
FlightJobScriptAPI.config.shared_secret

require_relative '../app'
