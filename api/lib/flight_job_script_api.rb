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
  autoload(:Configuration, 'flight_job_script_api/configuration')
  autoload(:ModelCache, 'flight_job_script_api/model_cache')
  autoload(:JobCLI, 'flight_job_script_api/job_cli')
  autoload(:CommandError, 'flight_job_script_api/job_cli')
  autoload(:Subprocess, 'flight_job_script_api/subprocess')

  class UnexpectedError < StandardError; end

  class << self
    def app
      # XXX: Eventually extract this to a Application object when the need arises
      @app ||= Struct.new(:config).new(
        Configuration.load
      )
    end

    def config
      app.config
    end

    def logger
      @logger ||= Logger.new($stdout, level: config.log_level.to_sym)
    end

    alias_method :load_configuration, :config
  end
end
