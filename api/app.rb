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

require 'sinatra/base'
require 'sinatra/jsonapi'
require_relative 'app/autoload'

# Adds 401 Unauthorized error
module Sinja
  class UnauthorizedError < HttpError
    HTTP_STATUS = 401

    def initialize(*args) super(HTTP_STATUS, *args) end
  end
end

# The base JSON:API for most interactions. Mounted in rack under
# /:version
class App < Sinatra::Base
  register Sinatra::JSONAPI

  helpers do
    def current_user
      @auth = FlightJobScriptAPI::PamAuth.build(env['HTTP_AUTHORIZATION'])
      @current_user = @auth.username
    end

    def role
      current_user
      case @auth.valid?
      when true
        :user
      when false
        :forbidden
      else
        raise Sinja::UnauthorizedError, 'Could not authenticate your authorization credentials'
      end
    end
  end

  configure_jsonapi do |c|
    # Resource roles
    c.default_roles = {
      index: :user,
      show: :user,
      create: :user,
      update: :user,
      destroy: :user
    }

    # To-one relationship roles
    c.default_has_one_roles = {
      pluck: :user,
      prune: :user,
      graft: :user
    }

    # To-many relationship roles
    c.default_has_many_roles = {
      fetch: :user,
      clear: :user,
      replace: :user,
      merge: :user,
      subtract: :user
    }
  end

  resource :authenticates, pkre: /user/ do
    helpers do
      def find(id)
        Authenticate.new(id: id)
      end
    end

    show
  end

  resource :templates, pkre: /[\w.-]+/ do
    helpers do
      def find(id)
        template = Template.new(id: id)
        if template.valid?
          template
        else
          FlightJobScriptAPI.logger.debug("Template is invalid: #{template.id}\n") do
            template.errors.full_messages.join("\n")
          end
          nil
        end
      end
    end

    index do
      # Generates a list of Templates
      templates = Dir.glob(Template.new(id: '*').metadata_path).map do |path|
        Template.new(id: File.basename(File.dirname(path)))
      end

      valid_templates = templates.select do |template|
        if template.valid?
          true
        else
          FlightJobScriptAPI.logger.error "Rejecting invalid template from index: #{template.id}\n" do
            template.errors.full_messages.join("\n")
          end
          false
        end
      end

      next valid_templates
    end

    show

    has_many :questions do
      fetch { resource.generation_questions }
    end
  end

  resource :scripts, pkre: /[[[:xdigit:]]-]+/ do
    helpers do
      def find(id)
        script = Script.new(id: id, user: current_user)
        script.valid? ? script : nil
      end
    end

    index do
      glob_path = Script.new(id: '*', user: current_user).metadata_path
      scripts = Dir.glob(glob_path).map do |path|
        id = File.basename File.dirname(path)
        Script.new(id: id, user: current_user)
      end

      next scripts
    end

    show

    destroy do
      FileUtils.rm_rf File.dirname(resource.metadata_path)
    end
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
  before do
    auth = FlightJobScriptAPI::PamAuth.build(env['HTTP_AUTHORIZATION'])
    case auth.valid?
    when true
      @current_user = auth.username
    when false
      status 403
      halt
    when nil
      status 401
      halt
    end
  end

  # Content-Type application/x-www-form-urlencoded is implicitly handled by sinatra
  use Rack::Parser, parsers: {
    'application/json' => ->(body) { JSON.parse(body) }
  }

  # TODO: The :id should be parsed against the same regex as above
  post '/:id' do
    template = Template.new(id: params['id'])
    if template.valid?
      response.headers['Content-Type'] = 'text/plain'
      script = Script.new(template: template, user: @current_user)

      # This conditional should not be reached ATM
      unless script.valid?
        status 500
        halt
      end

      begin
        script.render_and_save
      rescue
        status 422
        halt
      end

      status 201
      next script.script_path
    else
      status 404
      halt
    end
  end
end
