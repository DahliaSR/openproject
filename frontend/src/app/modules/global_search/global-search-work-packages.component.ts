// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Query,
  Renderer2
} from '@angular/core';
import {FocusHelperService} from 'app/modules/common/focus/focus-helper';
import {I18nService} from 'app/modules/common/i18n/i18n.service';
import {DynamicBootstrapper} from "app/globals/dynamic-bootstrapper";
import {HalResourceService} from "app/modules/hal/services/hal-resource.service";
import {GlobalSearchService} from "core-app/modules/global_search/services/global-search.service";
import {untilComponentDestroyed} from "ng2-rx-componentdestroyed";
import {QueryResource} from "app/modules/hal/resources/query-resource";
import {WorkPackageFiltersService} from "app/components/filters/wp-filters/wp-filters.service";
import {UrlParamsHelperService} from "app/components/wp-query/url-params-helper";
import {WorkPackageTableConfigurationObject} from "core-components/wp-table/wp-table-configuration";
import {cloneHalResource} from "core-app/modules/hal/helpers/hal-resource-builder";
import {IsolatedQuerySpace} from "core-app/modules/work_packages/query-space/isolated-query-space";
import {QueryFilterInstanceResource} from "core-app/modules/hal/resources/query-filter-instance-resource";
import {WorkPackageTableFiltersService} from "core-components/wp-fast-table/state/wp-table-filters.service";
import {debounceTime, distinctUntilChanged, skip} from "rxjs/operators";
import {combineLatest} from "rxjs";

export const globalSearchWorkPackagesSelector = 'global-search-work-packages';

@Component({
  selector: globalSearchWorkPackagesSelector,
  template: `
   <wp-embedded-table *ngIf="!resultsHidden"
                      [queryProps]="queryProps"
                      [configuration]="tableConfiguration">
    </wp-embedded-table>
  `
})

export class GlobalSearchWorkPackagesComponent implements OnInit, OnDestroy, AfterViewInit {
  public queryProps:{ [key:string]:any };
  public resultsHidden = false;

  public tableConfiguration:WorkPackageTableConfigurationObject = {
    actionsColumnEnabled: false,
    columnMenuEnabled: true,
    contextMenuEnabled: false,
    inlineCreateEnabled: false,
    withFilters: true,
    showFilterButton: true,
    filterButtonText: this.I18n.t('js.button_advanced_filter')
  };

  constructor(readonly FocusHelper:FocusHelperService,
              readonly elementRef:ElementRef,
              readonly renderer:Renderer2,
              readonly I18n:I18nService,
              readonly halResourceService:HalResourceService,
              readonly globalSearchService:GlobalSearchService,
              readonly wpTableFilters:WorkPackageTableFiltersService,
              readonly querySpace:IsolatedQuerySpace,
              readonly wpFilters:WorkPackageFiltersService,
              readonly cdRef:ChangeDetectorRef,
              private UrlParamsHelper:UrlParamsHelperService) {
  }

  ngAfterViewInit() {
    combineLatest(
      this.globalSearchService.searchTerm$,
      this.globalSearchService.projectScope$
    ).pipe(
      skip(1),
      distinctUntilChanged(),
      debounceTime(10),
      untilComponentDestroyed(this)
    )
    .subscribe(([newSearchTerm, newProjectScope]) => {
      this.wpFilters.visible = false;
      this.setQueryProps();
    });

    this.globalSearchService
      .resultsHidden$
      .pipe(
        untilComponentDestroyed(this)
      )
      .subscribe((resultsHidden:boolean) => this.resultsHidden = resultsHidden);
  }

  ngOnInit():void {
    this.setQueryProps();
  }

  ngOnDestroy():void {
    // Nothing to do
  }

  private setQueryProps():void {
    let filters:any[] = [];
    let columns = ['id', 'project', 'subject', 'type', 'status', 'updatedAt'];

    if (this.globalSearchService.searchTerm.length > 0) {
      filters.push({ search: {
          operator: '**',
          values: [this.globalSearchService.searchTerm] }});
    }

    if (this.globalSearchService.projectScope === 'current_project') {
      filters.push({ subprojectId: {
          operator: '!*',
          values: [] }});
      columns = ['id', 'subject', 'type', 'status', 'updatedAt'];
    }

    if (this.globalSearchService.projectScope === '') {
      filters.push({ subprojectId: {
          operator: '*',
          values: [] }});
    }

    this.queryProps = {
      'columns[]': columns,
      filters: JSON.stringify(filters),
      sortBy: JSON.stringify([['updatedAt', 'desc']]),
      showHierarchies: false
    };
  }
}

DynamicBootstrapper.register({
  selector: globalSearchWorkPackagesSelector, cls: GlobalSearchWorkPackagesComponent
});
