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

require 'spec_helper'

RSpec.describe '/authenticates' do
  context 'with an authenticated user' do
    before do
      allow(Rpam).to receive(:auth).and_return(true)
      header 'Accept', 'application/vnd.api+json'
      header 'Authorization', "Basic #{Base64.encode64('foo:bar')}"
    end

    describe '/authenticates/user' do
      it 'returns 200' do
        get '/authenticates/user'
        expect(last_response).to be_ok
      end
    end
  end

  describe '/authenticates/user' do
    def make_request
      get '/authenticates/user'
    end

    include_examples 'shared_auth_spec'
  end
end

