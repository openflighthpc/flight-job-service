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

RSpec.describe FlightJobScriptAPI::DefaultsOpenStruct do
  shared_examples 'ostruct lookup methods' do
    let(:value) { (0...8).map { (65 + rand(26)).chr }.join }
    subject do
      described_class.new({ key => value }) do |_, k|
        "default_#{k}"
      end
    end

    it 'supports method syntax' do
      expect(subject.send(key)).to eq(value)
    end

    it 'supports string lookups' do
      expect(subject[key.to_s]).to eq(value)
    end

    it 'supports symbol lookups' do
      expect(subject[key.to_sym]).to eq(value)
    end

    it 'supports default keys' do
      missing_key = "#{key}_missing"
      missing_value = "default_#{key}_missing"
      expect(subject.send(missing_key)).to eq(missing_value)
    end
  end

  describe 'with a string hash' do
    let(:key) { 'string_key' }

    include_examples 'ostruct lookup methods'
  end

  describe 'with a symbol hash' do
    let(:key) { :symbol_key }

    include_examples 'ostruct lookup methods'
  end
end
