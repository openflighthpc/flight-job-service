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

require 'sinatra/base'
require 'sinatra/jsonapi'
require_relative 'app/autoload'

# The base JSON:API for most interactions. Mounted in rack under
# /:version
class App < Sinatra::Base
  register Sinatra::JSONAPI

  resource :templates, pkre: /[\w.-]+/ do
    helpers do
      def find(id)
        template = Template.from_id(id)
        template.valid? ? template : nil
      end
    end

    index do
      paths_with_ext = Dir.glob(Template.new(name: '*', extension: '*').template_path)
      paths_sans_ext = Dir.glob(Template.new(name: '*', extension: nil).template_path)

      [*paths_with_ext, *paths_sans_ext].map do |path|
        id = File.basename(path).chomp('.erb')
        Template.from_id(id)
      end
    end

    show
  end

  freeze_jsonapi
end

# NOTE: The render route is implemented independently because:
# 1. It does not conform to the JSON:API standard
# 2. Sinja would require an work around involving the Content-Type/Accept headers
# 3. Even with the work aroud, authentication needs manual integration
#
# The two apps are mounted together in rack. This app is mounted under
# /:version/render
class RenderApp < Sinatra::Base
  # Content-Type application/x-www-form-urlencoded is implicitly handled by sinatra
  use Rack::Parser, parsers: {
    'application/json' => ->(body) { JSON.parse(body) }
  }

  post '/:id' do
    template = Template.from_id(params['id'])
    if template.valid?
      attachment(template.attachment_name, :attachment)
      response.headers['Content-Type'] = 'text/plain'
      next template.render_template
    else
      status 404
      halt
    end
  end
end
