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

module FlightJobScriptAPI::ModelCache
  def index(**opts)
    super.tap do |records|
      records.each do |record|
        set_in_cache(record.id, record)
        record.cache_related_resources if record.respond_to?(:cache_related_resources)
      end
    end
  end

  def find!(id, **opts)
    record = get_from_cache(id)
    return record unless record.nil?
    super.tap do |record|
      set_in_cache(id, record) unless record.nil?
      record.cache_related_resources if record.respond_to?(:cache_related_resources)
    end
  end

  def cache(*args, **opts)
    model = new(*args, **opts)
    id = model.id
    if record = get_from_cache(id)
      # NOTE: Records are not re-cached as it may cause duplicate resources
      # when loading many-to-one relationships
      record
    else
      set_in_cache(id, model)
      model.cache_related_resources if model.respond_to?(:cache_related_resources)
      model
    end
  end

  private

  # NOTE: The 'id' is unique on a per user basis instead of globally. This works
  #       as the RequestStore cache's 'per request' and thus is also 'per user'.
  def get_from_cache(id)
    cache_id = "#{self.name}:#{id}"
    RequestStore[cache_id]
  end

  def set_in_cache(id, record)
    cache_id = "#{self.name}:#{id}"
    RequestStore[cache_id] = record
  end
end
