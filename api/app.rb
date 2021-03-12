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
require 'sinatra/cookies'
require 'sinatra/jsonapi'
require_relative 'app/autoload'

# Additional error codes
module Sinja
  class UnauthorizedError < HttpError
    HTTP_STATUS = 401

    def initialize(*args) super(HTTP_STATUS, *args) end
  end

  class ServiceUnavailable < HttpError
    HTTP_STATUS = 503

    def initialize(*args) super(HTTP_STATUS, *args) end
  end
end

# The base JSON:API for most interactions. Mounted in rack under
# /:version
class App < Sinatra::Base
  register Sinatra::JSONAPI
  helpers Sinatra::Cookies

  helpers do
    def auth
      @auth ||= FlightJobScriptAPI.config.auth_decoder.decode(
        cookies[FlightJobScriptAPI.app.config.sso_cookie_name],
        env['HTTP_AUTHORIZATION']
      )
    end

    def current_user
      auth.username
    end

    def role
      if auth.valid?
        :user
      elsif auth.forbidden?
        :forbidden
      else
        raise Sinja::UnauthorizedError, 'Could not authenticate your authorization credentials'
      end
    end
  end

  configure_jsonapi do |c|
    c.validation_exceptions << ActiveModel::ValidationError
    c.validation_formatter = ->(e) do
      e.model.errors.messages.map do |src, msg|
        [src, msg.join(', ')]
      end
    end

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

  resource :templates, pkre: /[\w.-]+/ do
    helpers do
      def find(id)
        raise NotImplementedError
      end
    end

    index do
      Template.index(user: current_user)
    end

    show

    has_many :questions do
      fetch { raise NotImplementedError; resource.generation_questions }
    end
  end

  resource :scripts, pkre: /[\w-]+/ do
    helpers do
      def find(id)
        raise NotImplementedError
      end
    end

    index do
      raise NotImplementedError
    end

    show

    # TODO: Reimplement me in the CLI
    # Remember to update the routes document
    # destroy do
    #   raise NotImplementedError
    # end
  end

  resource :jobs, pkre: /[\w-]+/ do
    helpers do
      def find(id)
        raise NotImplementedError
      end

      def validate!
        raise NotImplementedError
        # if @action == :create
        #   resource.validate!(:submit)
        #   resource.submit
        # else
        #   raise Sinja::ForbiddenError, 'Jobs can not be modfied!'
        # end
      end
    end

    index do
      raise NotImplementedError
    end

    show do
      raise NotImplementedError
    end

    create do |attr|
      raise NotImplementedError
    end

    has_one :script do
      graft(sideload_on: :create) do |rio|
        raise NotImplementedError
      end
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
  helpers Sinatra::Cookies

  before do
    auth = FlightJobScriptAPI.config.auth_decoder.decode(
      cookies[FlightJobScriptAPI.app.config.sso_cookie_name],
      env['HTTP_AUTHORIZATION']
    )

    if auth.valid?
      @current_user = auth.username
    elsif auth.forbidden?
      status 403
      halt
    else
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
    raise NotImplementedError
    # template = Template.new(id: params['id'])
    # if template.valid?
    #   response.headers['Content-Type'] = 'text/plain'
    #   script = Script.new(template: template, user: @current_user)

    #   # This conditional should not be reached ATM
    #   unless script.valid?
    #     status 500
    #     halt
    #   end

    #   begin
    #     script.render_and_save(**params.to_h.transform_keys(&:to_sym))
    #   rescue
    #     FlightJobScriptAPI.logger.debug("Rendering script failed") { $! }
    #     status 422
    #     halt
    #   end

    #   status 201
    #   next script.script_path
    # else
    #   status 404
    #   halt
    # end
  end
end
