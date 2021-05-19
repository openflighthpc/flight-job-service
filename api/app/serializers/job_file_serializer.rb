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

class JobFileSerializer < ApplicationSerializer
  # NOTE: Update this constant as new attributes are added
  DEFAULT_SPARSE_FIELDSET = "path,decodedPath,filename,size,mimeType"

  def type
    'files'
  end

  def meta
    unless attributes.keys.include?("payload")
      <<~INFO.squish
        The 'payload' attribute is hidden by default. It can be returned by
        specifying a sparse fieldset: 'fields[files]=payload'
      INFO
    end
  end

  # Recalculate the file size if the payload will be included in the request
  attribute(:size) do
    object.size(recalculate: @_fields.fetch('files', []).include?(:payload))
  end

  # Forces the file to be UTF-8 encoded
  # NOTE: This assumes binary files are not supported
  attribute(:payload) { object.payload.force_encoding('utf-8') }

  # Hide that path could be set to "false". This is for internal caching
  # purposes.
  attribute(:path) { object.path || nil }
  attribute(:decoded_path) { object.decoded_file_id || nil }

  attribute :filename

  # NOTE: The default is text/plain because the string encoding is forced to be UTF8
  attribute(:mime_type) { MIME::Types.type_for(object.filename)&.first&.content_type || 'text/plain' }

  has_one(:job) { object.find_job }
end
