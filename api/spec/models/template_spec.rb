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

RSpec.describe Template do
  subject { build(:template) }

  it { should be_valid }

  context 'without a script' do
    subject { build(:template, save_script: false) }
    it { should_not be_valid }
  end

  context 'without a metadata file' do
    subject { build(:template, save_metadata: false) }
    it { should_not be_valid }
  end

  context 'with invalid YAML metadata' do
    subject { build(:template, save_metadata: '}{') }
    it { should_not be_valid }
  end

  describe '#render_template' do
    context 'without any ERB' do
      subject { build(:template, save_script: 'Foobar Bazz') }

      it 'returns the raw script' do
        script = File.read subject.template_path
        expect(subject.render_template(foobiz: 'Foobizz')).to eq(script)
      end
    end

    context 'with ERB' do
      subject { build(:template, save_script: '<%= foobiz %>') }

      it 'returns the rendered erb' do
        value = 'foobaz'
        expect(subject.render_template(foobiz: value)).to eq(value)
      end

      it 'handles missing values' do
        expect(subject.render_template).to eq('')
      end
    end
  end
end
