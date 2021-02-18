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

require 'spec_helper'

RSpec.describe '/render' do
  context 'with an authenicated user' do
    before do
      header 'Authorization', "Bearer #{build(:jwt)}"
    end

    describe 'POST - application/json' do
      before do
        header 'Content-Type', 'application/json'
      end

      context 'with a missing template' do
        before { post "/render/missing" }

        it 'returns 404 for unknown ids' do
          expect(last_response).to be_not_found
        end
      end

      context 'with a render error' do
        before do
          template = build(:template)
          mock_context = FlightJobScriptAPI::RenderContext.new(template: template, answers: {})

          allow(mock_context).to receive(:render) { raise 'A render error has occurred!' }
          allow(FlightJobScriptAPI::RenderContext).to receive(:new).and_return(mock_context)

          post "/render/#{template.id}", '{}'
        end

        it 'returns 422' do
          expect(last_response.status).to be(422)
        end
      end

      context 'with a static template' do
        let(:template) { build(:template, save_script: "#!/bin/bash\necho foobar") }

        before { post "/render/#{template.id}", "{}" }

        it 'creates the file' do
          expect(last_response).to be_created
        end

        it 'returns the path to the rendered script' do
          expect(last_response.headers['Content-Type']).to eq('text/plain')
          expect(File.read last_response.body).to eq(File.read template.template_path)
        end
      end
    end
  end

  describe '/render/foo' do
    def make_request
      post '/render/foo'
    end
    include_examples 'shared_auth_spec'
  end
end
