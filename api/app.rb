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

require 'sinatra/jsonapi'

require_relative 'app/autoload'

resource :templates, pkre: /[\w.-]+/ do
  helpers do
    def find(id)
      name, ext = id.split('.', 2)
      template = Template.new(name: name, extension: ext)
      template.valid? ? template : nil
    end
  end

  index do
    paths_with_ext = Dir.glob(Template.new(name: '*', extension: '*').template_path)
    paths_sans_ext = Dir.glob(Template.new(name: '*', extension: nil).template_path)

    [*paths_with_ext, *paths_sans_ext].map do |path|
      basename = File.basename(path)
      Template.new(
        name: basename.sub(/\..*\Z/, ''),
        extension: /(\..*)?\.erb\Z/.match(basename)
      )
    end
  end

  show
end

