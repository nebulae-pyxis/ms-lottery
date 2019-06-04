////////// ANGULAR //////////
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
////////// RXJS ///////////
import { map, mergeMap, tap, takeUntil } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
//////////// ANGULAR MATERIAL ///////////
import { MatSnackBar } from '@angular/material';
//////////// i18n ////////////
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';
//////////// Other Services ////////////
import { KeycloakService } from 'keycloak-angular';
import { DrawDetailService } from './draw-detail.service';
import { fuseAnimations } from '../../../../core/animations';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'pyxis-draw-detail',
  templateUrl: './draw-detail.component.html',
  styleUrls: ['./draw-detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})
// tslint:disable-next-line:class-name
export class DrawDetailComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  service: any;

  ///////////////////////////////////////////

  detailsOpened = false;
  resultsOpened = true;
  approvementOpened = false;

  selectedDraw = {
    generalInfo: {
      creationTimestamp: 15987485769,
      stateIcon: 'favorite',
      state: 'OPEN'
    },
    results: undefined,
    approved: undefined,
    // tslint:disable-next-line: max-line-length
    approvedNotes: `We've covered quite a bit of ground here, but it merely scratches the surface
    of how we can control the style of links.
    If you're ready to level up, then here are a few resources you can jump into from here:`
  };

  versionlist = [1, 2, 3, 4, 5];

  ///////////////////////////////////////////

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private drawDetailService: DrawDetailService,
    private route: ActivatedRoute
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.loadDraw();
    this.listenDrawUpdates('');
  }

  loadDraw() {
    this.route.params
      .pipe(
        map(params => params['id']),
        mergeMap(entityId =>
          entityId !== 'new'
            ? this.drawDetailService
                .getServiceService$(entityId)
                .pipe(map(res => res.data.ServiceService))
            : of(null)
        ),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(
        (service: any) => {
          this.service = service;
        },
        e => console.log(e)
      );
  }

  showSnackBar(message) {
    this.snackBar.open(
      this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('SERVICE.CLOSE'),
      {
        duration: 2000
      }
    );
  }

  listenDrawUpdates(id){
    this.drawDetailService.listenDrawUpdates$(id)
    .pipe(
      tap(x => {
        if (x.code === 200){
          console.log(x);
          this.selectedDraw.results = true;
        }
        if (x.code === 400){
          console.log(x);
          this.selectedDraw.approved = true;
        }
      } )

    )
    .subscribe();

  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
