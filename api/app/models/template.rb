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

class Template
  class << self
    prepend FlightJobScriptAPI::ModelCache

    def index(**opts)
      cmd = FlightJobScriptAPI::JobCLI.list_templates(**opts).tap do |cmd|
        next if cmd.exitstatus == 0
        raise FlightJobScriptAPI::CommandError, 'Unexpectedly failed to list templates'
      end
      cmd.stdout.map do |metadata|
        new(**metadata)
      end
    end

    def find(id, **opts)
      find!(id, **opts)
    rescue FlightJobScriptAPI::CommandError
      nil
    end

    def find!(id, **opts)
      # The underlying CLI supports non-deterministic indexing of templates
      # This "okay" in the CLI but makes the API unnecessarily complicated
      # Instead, all "ids" which match an integer will be ignored
      # NOTE: This means templates which are named after an integer may be indexed
      #       but can't be found. However this is an odd edge case and is currently
      #       being ignored
      return if /\A\d+\Z/.match?(id)

      cmd = FlightJobScriptAPI::JobCLI.info_template(id, **opts).tap do |cmd|
        next if cmd.exitstatus == 0
        return nil if cmd.exitstatus == 21
        raise FlightJobScriptAPI::CommandError, "Unexpectedly failed to find template: #{id}"
      end

      new(**cmd.stdout)
    end
  end

  attr_reader :metadata

  def initialize(**metadata)
    @metadata = metadata
  end

  def id
    metadata['id']
  end

  def generation_questions
    metadata['generation_questions'].map { |metadata| Question.new(**metadata) }
  end
end
