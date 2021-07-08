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

class JobSerializer < ApplicationSerializer
  [
    'created_at', 'stdout_path', 'stderr_path', 'state', 'reason',
    'scheduler_id', 'submit_stdout', 'submit_stderr',
    'estimated_start_time', 'estimated_end_time', 'results_dir', 'submit_status'
  ].each do |field|
    attribute(field) { object.metadata[field] }
  end

  attribute(:start_time) { object.metadata['actual_start_time'] }
  attribute(:end_time) { object.metadata['actual_end_time'] }
  attribute(:merged_stderr) { object.stderr_merged? }

  has_one :script
  has_one(:stdout_file) { object.find_stdout_file }
  has_one(:stderr_file) { object.find_stderr_file }
  has_many(:result_files) { object.index_result_files }
end
