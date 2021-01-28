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

module FlightJobScriptAPI
  # NOTE: The render context has been designed to allow a super-set of question
  # not defined on the template.
  RenderContext = Struct.new(:template, :questions_array, :answers_hash) do
    def render
      bind = Hashie::Mash.new(to_h).instance_exec { binding }
      template.to_erb.result(bind)
    end

    def to_h
      {
        'template' => template_hash,
        'questions' => questions_hash
      }
    end

    private

    def template_hash
      @template_hash ||= begin
        sub_questions_hash = template.questions.reduce({}) do |memo, question|
          id = question.id
          memo.merge({ id => questions_hash[id] || convert_question(question) })
        end
        template.to_h.merge({ 'questions' => sub_questions_hash })
      end
    end

    def questions_hash
      @questions_hash ||= questions_array.reduce({}) do |memo, question|
        memo.merge({ question.id => convert_question(question) })
      end
    end

    def convert_question(question)
      question.to_h.merge({ 'answer' => answers_hash[question.id] })
    end
  end
end
