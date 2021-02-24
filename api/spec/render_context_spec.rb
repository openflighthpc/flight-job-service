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

RSpec.describe FlightJobScriptAPI::RenderContext do
  context 'when rendering general quetions' do
    let(:default) { 'the-default' }
    let(:answer) { 'the-answer' }
    let(:question) { build(:question_hash, default: default) }
    let(:template) do
      build(:template,
            save_generation_questions: [question],
            save_script: script_template)
    end

    let(:script_builder) do
      ->(default, answer, missing) do
        <<~SCRIPT
          #!/bin/bash
          echo And the answer is #{answer}!
          echo And the default is #{default}!
          echo The missing question is here ->#{missing}<-
        SCRIPT
      end
    end
    let(:script_template) do
      script_builder.call(
        "<%= questions.#{question['id']}.default -%>",
        "<%= questions.#{question['id']}.answer -%>",
        "<%= questions.missing.answer -%>"
      )
    end
    let(:script_rendered) do
      script_builder.call(default, answer, '')
    end

    subject do
      described_class.new(template: template,
                          answers: { question['id'].to_sym => answer })
    end

    it 'renders the general answers into the script' do
      expect(subject.render).to eq(script_rendered)
    end
  end
end
