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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {WorkPackageTableHighlightingService} from "core-components/wp-fast-table/state/wp-table-highlighting.service";
import {CardViewOrientation} from "core-components/wp-card-view/wp-card-view.component";
import {WorkPackageTableSortByService} from "core-components/wp-fast-table/state/wp-table-sort-by.service";
import {distinctUntilChanged, takeUntil} from "rxjs/operators";
import {HighlightingMode} from "core-components/wp-fast-table/builders/highlighting/highlighting-mode.const";
import {IsolatedQuerySpace} from "core-app/modules/work_packages/query-space/isolated-query-space";

@Component({
  selector: 'wp-grid',
  template: `
    <wp-card-view [dragOutOfHandler]="canDragOutOf"
                  [dragInto]="true"
                  [cardsRemovable]="false"
                  [highlightingMode]="highlightingMode"
                  [showStatusButton]="false"
                  [orientation]="gridOrientation"
                  (onMoved)="switchToManualSorting()">
    </wp-card-view>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkPackagesGridComponent {
  public canDragOutOf = () => { return true; };
  public gridOrientation:CardViewOrientation = 'horizontal';
  public highlightingMode:HighlightingMode = 'none';

  constructor(readonly wpTableHighlight:WorkPackageTableHighlightingService,
              readonly wpTableSortBy:WorkPackageTableSortByService,
              readonly querySpace:IsolatedQuerySpace,
              readonly cdRef:ChangeDetectorRef) {
  }

  ngOnInit() {
    this.wpTableHighlight
      .updates$()
      .pipe(
        takeUntil(this.querySpace.stopAllSubscriptions),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.highlightingMode = this.wpTableHighlight.current.mode;
        this.cdRef.detectChanges();
      });

  }

  ngOnDestroy():void {
    // Nothing to do
  }

  public switchToManualSorting() {
    this.wpTableSortBy.switchToManualSorting();
  }
}
