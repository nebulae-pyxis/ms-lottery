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
import { NoteDialogComponent } from './note-dialog/note-dialog.component';
import { GameSheetConfigComponent } from './game-detail/sheet-config/game-sheet-config.component';
import { GameSheetConfigGeneralInfoComponent } from './game-detail/sheet-config/general-info/game-sheet-config-general-info.component';
import { GameSheetConfigApprovalInfoComponent } from './game-detail/sheet-config/approval-info/game-sheet-config-approval-info.component';
import { GameSheetConfigMetadataComponent } from './game-detail/sheet-config/metadata/game-sheet-config-metada.component';
import { GamePrizeProgramComponent } from './game-detail/prize-program/game-prize-program.component';
import { GamePrizeProgramApprovalInfoComponent } from './game-detail/prize-program/approval-info/game-prize-program-approval-info.component';
import { GamePrizeProgramGeneralInfoComponent } from './game-detail/prize-program/general-info/game-prize-program-general-info.component';
import { GamePrizeProgramMetadataComponent } from './game-detail/prize-program/metadata/game-prize-program-metada.component';
import { PrizeProgramService } from './game-detail/prize-program/prize-program.service';
import { PrizeProgramGrandPrizeComponent } from './game-detail/prize-program/general-info/grand-prize/prize-program-grand-prize.component';
import { PrizeProgramTwoOutOfThreeComponent } from './game-detail/prize-program/general-info/two-out-of-three/prize-program-two-out-of-three.component';
import { PrizeProgramSecondaryPrizeComponent } from './game-detail/prize-program/general-info/secondary-prize/prize-program-secondary-prize.component';
import { SecondaryPrizeDialogComponent } from './game-detail/prize-program/general-info/secondary-prize/secondary-prize-dialog/secondary-prize-dialog.component';
import { ApproximationDialogComponent } from './game-detail/prize-program/general-info/approximation/approximation-dialog/approximation-dialog.component';
import { PrizeProgramApproximationComponent } from './game-detail/prize-program/general-info/approximation/prize-program-approximation.component';

import { NoteDialogComponent as NoteDialogComponent2 } from './game-detail/prize-program/approval-info/note-dialog/note-dialog.component';
import { DialogComponent as ApprovalInfoDialog } from './game-detail/sheet-config/approval-info/dialog/dialog.component';
import { DialogComponent as ApprovalInfoDialogComponent } from './game-detail/prize-program/approval-info/dialog/dialog.component';
import { NoteDialogComponent as NoteDialogComponent3 } from './game-detail/sheet-config/approval-info/note-dialog/note-dialog.component';


const routes: Routes = [
  {
    path: '',
    component: GameListComponent,
  },
  {
    path: ':id',
    component: GameDetailComponent,
  },
  {
    path: ':id/:section',
    component: GameDetailComponent,
  },
  {
    path: ':id/:section/:itemId',
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
    ApprovalInfoDialogComponent,
    NoteDialogComponent2,
    NoteDialogComponent3,
    ApprovalInfoDialog,
    NoteDialogComponent,
    SecondaryPrizeDialogComponent,
    ApproximationDialogComponent,
    GameListComponent,
    GameDetailComponent,
    GameDetailGeneralInfoComponent,
    GameSheetConfigComponent,
    GameSheetConfigGeneralInfoComponent,
    GameSheetConfigApprovalInfoComponent,
    GameSheetConfigMetadataComponent,
    GamePrizeProgramComponent,
    GamePrizeProgramApprovalInfoComponent,
    GamePrizeProgramGeneralInfoComponent,
    GamePrizeProgramMetadataComponent,
    PrizeProgramGrandPrizeComponent,
    PrizeProgramTwoOutOfThreeComponent,
    PrizeProgramSecondaryPrizeComponent,
    PrizeProgramApproximationComponent
  ],
  entryComponents: [NoteDialogComponent3, ApprovalInfoDialog, NoteDialogComponent2, ApprovalInfoDialogComponent, DialogComponent, NoteDialogComponent, SecondaryPrizeDialogComponent, ApproximationDialogComponent],
  providers: [ GameService, GameListService, GameDetailService, PrizeProgramService,  DatePipe]
})

export class GameModule {}
