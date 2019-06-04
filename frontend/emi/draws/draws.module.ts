import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { ToolbarService } from '../../toolbar/toolbar.service';
import { ConfirmationDialogComponent } from './dialog/dialog.component';
import { DrawListService } from './draw-list/draw-list.service';
import { DrawListComponent } from './draw-list/draw-list.component';
import { DrawDetailService } from './draw-detail/draw-detail.service';
import { DrawDetailComponent } from './draw-detail/draw-detail.component';
import { DrawDetailGeneralInfoComponent } from './draw-detail/general-info/general-info.component';
import { DrawDetailResultsComponent } from './draw-detail/results/results.component';
import { DrawDetailApprovementComponent } from './draw-detail/approvement/approvement.component';
import {NgxMaskModule, IConfig} from 'ngx-mask';

const routes: Routes = [
  { path: '', component: DrawListComponent },
  { path: ':id', component: DrawDetailComponent  }
];


export const options: Partial<IConfig> | (() => Partial<IConfig>) = undefined;


@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FuseWidgetModule,
    NgxMaskModule.forRoot(options)
  ],
  declarations: [
    ConfirmationDialogComponent,
    DrawListComponent,
    DrawDetailComponent,
    DrawDetailGeneralInfoComponent,
    DrawDetailResultsComponent,
    DrawDetailApprovementComponent
  ],
  entryComponents: [ConfirmationDialogComponent],
  providers: [DatePipe, DrawListService, DrawDetailService, ToolbarService]
})


export class DrawsModule {}
