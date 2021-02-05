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

require 'spec_helper'

RSpec.describe '/templates' do
  context 'with an authenticated user' do
    before do
      allow(Rpam).to receive(:auth).and_return(true)
      header 'Accept', 'application/vnd.api+json'
      header 'Authorization', "Basic #{Base64.encode64('foo:bar')}"
    end

    describe '#index' do
      let!(:templates) do
        10.times.map do |int|
          base = "index-foo-script-#{int}"
          # Intentionally creates an ID with a file extension
          [build(:template, id: base), build(:template, id: "#{base}.sh")]
        end.flatten
      end

      it 'returns a list with the templates' do
        get '/templates'
        expect(last_response).to be_ok
        names = last_response_data.map { |t| t[:id] }
        expect(names).to include(*templates.map(&:id))
      end
    end

    describe '#show' do
      let(:name_base) { 'foo-script' }
      # Intentionally creates an ID with a file extension
      let!(:template_with_ext) do
        build(:template, id: "#{name_base}.sh")
      end
      let!(:template_sans_ext) do
        build(:template, id: name_base)
      end

      it 'returns 404 if missing' do
        get '/templates/missing'
        expect(last_response).to be_not_found
      end

      it 'can find a template sans extension' do
        template = template_sans_ext
        get "/templates/#{template.id}"
        expect(last_response).to be_ok
        expect(last_response_data[:id]).to eq(template.id)
        expect(last_response_data[:attributes][:extension]).to be_nil
      end

      # NOTE: In practice the ID's will no longer contain a file extension
      # However it is still formally allowed within the specification
      it 'can find a template with an extension' do
        template = template_with_ext
        get "/templates/#{template.id}"
        expect(last_response).to be_ok
        expect(last_response_data[:id]).to eq(template.id)
      end
    end
  end

  describe '/templates' do
    def make_request
      get '/templates'
    end

    include_examples 'shared_auth_spec'
  end
end
