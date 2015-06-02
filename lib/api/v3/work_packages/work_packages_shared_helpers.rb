#-- copyright
# OpenProject is a project management system.
# Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See doc/COPYRIGHT.rdoc for more details.
#++

require 'api/v3/work_packages/base_contract'
require 'api/v3/work_packages/work_package_payload_representer'

module API
  module V3
    module WorkPackages
      module WorkPackagesSharedHelpers
        extend Grape::API::Helpers
        def request_body
          env['api.request.body']
        end

        def merge_hash_into_work_package!(hash, work_package)
          payload = ::API::V3::WorkPackages::WorkPackagePayloadRepresenter.create(work_package)
          payload.from_hash(hash)
        end

        def write_work_package_attributes(work_package, reset_lock_version: false)
          if request_body
            work_package.lock_version = nil if reset_lock_version
            # we need to merge the JSON two times:
            # In Pass 1 the representer only has custom fields for the current WP type
            # After Pass 1 the correct type information is merged into the WP
            # In Pass 2 the representer is created with the new type info and will be able
            # to also parse custom fields successfully
            merge_hash_into_work_package!(request_body, work_package)
            merge_hash_into_work_package!(request_body, work_package)
          end
        end

        def create_work_package_form(work_package, contract_class:, form_class:)
          write_work_package_attributes(work_package, reset_lock_version: true)
          contract = contract_class.new(work_package, current_user)
          errors = contract.validate_contract_and_model

          api_error = ::API::Errors::ErrorBase.create(errors)

          if api_error.is_a? ::API::Errors::Validation
            status 200
            form_class.new(work_package, current_user: current_user, errors: errors)
          else
            fail api_error
          end
        end
      end
    end
  end
end
