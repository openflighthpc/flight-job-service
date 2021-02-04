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

RSpec.describe '/scripts' do
  context 'with an authenticated user' do
    before do
      allow(Rpam).to receive(:auth).and_return(true)
      header 'Accept', 'application/vnd.api+json'
      header 'Authorization', "Basic #{Base64.encode64("#{ENV['USER']}:bar").chomp}"
    end

    context "with a different user's script" do
      let(:other_user) { 'foo' }
      let(:script) { create(:script, user: other_user) }

      before(:each) do
        allow(Script).to receive(:base_path).and_wrap_original do |m, *args|
          if other_user == args.first
            File.join('/tmp', other_user)
          else
            m.call(*args)
          end
        end

        script # Ensure the script exists
      end

      describe '#index' do
        specify "the user can not see the other user's script " do
          get '/scripts'
          expect(last_response).to be_ok
          expect(last_response_data.map { |d| d[:id] }).not_to include(script.id)
        end

        specify 'the other user can see their script' do
          header 'Authorization', "Basic #{Base64.encode64("#{other_user}:bar").chomp}"
          get '/scripts'
          expect(last_response).to be_ok
          expect(last_response_data.map { |d| d[:id] }).to include(script.id)
        end
      end

      describe '#show' do
        specify "accessing the other user's script returns 404" do
          get "/scripts/#{script.id}"
          expect(last_response).to be_not_found
        end
      end
    end

    context "with a user's script" do
      let!(:script) { create(:script, user: ENV['USER']) }

      describe '#index' do
        before do
          get '/scripts'
        end

        it 'exited ok' do
          expect(last_response).to be_ok
        end

        it 'returns the script' do
          expect(last_response_data.map { |d| d[:id] }).to include(script.id)
        end
      end
    end
  end
end
