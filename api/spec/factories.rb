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

FactoryBot.define do
  factory :template do
    sequence(:name) { |n| "demo-template-#{n}" }

    transient do
      save_metadata { YAML.dump({}) }
      save_script do
        <<~SCRIPT
          #! /bin/bash
          echo I am the #{name} script
        SCRIPT
      end
    end

    initialize_with do
      new(**attributes).tap do |template|
        if (save_metadata || save_script) && !FakeFS.activated?
          raise 'Refusing to write mocked factory data to the file system'
        end
        if save_metadata
          FileUtils.mkdir_p File.dirname(template.metadata_path)
          File.write(template.metadata_path, save_metadata)
        end
        if save_script
          FileUtils.mkdir_p File.dirname(template.script_path)
          File.write(template.script_path, save_script)
        end
      end
    end
  end
end
