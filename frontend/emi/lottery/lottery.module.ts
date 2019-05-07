import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { LotteryService } from './lottery.service';
import { LotteryListService } from './lottery-list/lottery-list.service';
import { LotteryListComponent } from './lottery-list/lottery-list.component';
import { LotteryDetailService } from './lottery-detail/lottery-detail.service';
import { LotteryDetailComponent } from './lottery-detail/lottery-detail.component';
import { LotteryDetailGeneralInfoComponent } from './lottery-detail/general-info/lottery-general-info.component';
import { ToolbarService } from '../../toolbar/toolbar.service';
import { DialogComponent } from './dialog/dialog.component';

const routes: Routes = [
  {
    path: '',
    component: LotteryListComponent,
  },
  {
    path: ':id',
    component: LotteryDetailComponent,
  }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FuseWidgetModule
  ],
  declarations: [
    DialogComponent,
    LotteryListComponent,
    LotteryDetailComponent,
    LotteryDetailGeneralInfoComponent
  ],
  entryComponents: [DialogComponent],
  providers: [ LotteryService, LotteryListService, LotteryDetailService, DatePipe]
})

export class LotteryModule {}
