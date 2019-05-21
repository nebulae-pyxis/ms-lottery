import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { CurrencyMaskModule } from 'ng2-currency-mask';

import { GameService } from './game.service';
import { GameListService } from './game-list/game-list.service';
import { GameListComponent } from './game-list/game-list.component';
import { GameDetailService } from './game-detail/game-detail.service';
import { GameDetailComponent } from './game-detail/game-detail.component';

import { GameDetailGeneralInfoComponent } from './game-detail/general-info/game-general-info.component';
import { ToolbarService } from '../../toolbar/toolbar.service';
import { DialogComponent } from './dialog/dialog.component';
import { GameSheetConfigComponent } from './game-detail/sheet-config/game-sheet-config.component';
import { GameSheetConfigGeneralInfoComponent } from './game-detail/sheet-config/general-info/game-sheet-config-general-info.component';
import { GameSheetConfigApprovalInfoComponent } from './game-detail/sheet-config/approval-info/game-sheet-config-approval-info.component';
import { GameSheetConfigMetadataComponent } from './game-detail/sheet-config/metadata/game-sheet-config-metada.component';
import { NoteDialogComponent } from './game-detail/sheet-config/approval-info/note-dialog/note-dialog.component';



const routes: Routes = [
  {
    path: '',
    component: GameListComponent,
  },
  {
    path: ':id',
    component: GameDetailComponent,
  }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FuseWidgetModule,
    CurrencyMaskModule
  ],
  declarations: [
    DialogComponent,
    NoteDialogComponent,
    GameListComponent,
    GameDetailComponent,
    GameDetailGeneralInfoComponent,
    GameSheetConfigComponent,
    GameSheetConfigGeneralInfoComponent,
    GameSheetConfigApprovalInfoComponent,
    GameSheetConfigMetadataComponent
  ],
  entryComponents: [DialogComponent, NoteDialogComponent],
  providers: [ GameService, GameListService, GameDetailService, DatePipe]
})

export class GameModule {}
