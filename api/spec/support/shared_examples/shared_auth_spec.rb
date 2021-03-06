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

RSpec.shared_examples 'shared_auth_spec' do
  context 'with a missing Authorization header' do
    before do
      header 'Accept', 'application/vnd.api+json'
    end

    it 'returns 401' do
      make_request
      expect(last_response).to be_unauthorized
    end
  end

  context 'with invalid Authorization encoding' do
    before do
      header 'Accept', 'application/vnd.api+json'
      header 'Authorization', "Bearer foobar"
    end

    it 'returns 401' do
      make_request
      expect(last_response).to be_unauthorized
    end
  end

  context 'with an invalid authorization scheme' do
    before do
      header 'Accept', 'application/vnd.api+json'
      header 'Authorization', "Foobar foobar"
    end

    it 'returns 401' do
      make_request
      expect(last_response).to be_unauthorized
    end
  end

  context 'with an expired token' do
    before do
      header 'Accept', 'application/vnd.api+json'
      exp = Time.now.to_i - 1
      header 'Authorization', "Foobar #{build(:jwt, iat: exp - 1, exp: exp)}"
    end

    it 'returns 401' do
      make_request
      expect(last_response).to be_unauthorized
    end
  end

  context 'with a future issued token' do
    before do
      header 'Accept', 'application/vnd.api+json'
      iat = Time.now.to_i + 30
      header 'Authorization', "Foobar #{build(:jwt, iat: iat)}"
    end

    it 'returns 401' do
      make_request
      expect(last_response).to be_unauthorized
    end
  end

  context 'with a missing username' do
    before do
      header 'Accept', 'application/vnd.api+json'
      header 'Authorization', "Bearer #{build(:jwt, username: nil)}"
    end

    it 'returns 403' do
      make_request
      expect(last_response).to be_forbidden
    end
  end

  context 'with the incorrect shared secret' do
    before do
      header 'Accept', 'application/vnd.api+json'
      header 'Authorization', "Bearer #{build(:jwt, shared_secret: 'foobar')}"
    end

    it 'returns 403' do
      make_request
      expect(last_response).to be_forbidden
    end
  end
end
