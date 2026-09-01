import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { I18nService } from '@shared/services/i18n.service';
import { SharedPropertiesService } from '@shared/services/shared-properties.service';
import { SharedFunctionsService } from '@shared/services/shared-functions.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {
  public boardId: string = '';
  public checkIns: any[] = [];
  public loading: boolean = true;

  constructor(
    private objRoute: ActivatedRoute,
    private i18n: I18nService,
    private sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService
  ) { }

  ngOnInit(): void {
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();
    this.sharedProp.actionSetter({
      content_title: this.i18n.instant('BOARDS.LIST.OPEN'),
      content_icon: 'tv',
      add_button: false,
      filters_form: false
    });
    this.boardId = this.objRoute.snapshot.params['_id'];
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.sharedFunctions.find('check_in_boards', { 'filter[fk_board]': this.boardId, 'sort[date]': 1 }, (res) => {
      this.checkIns = res.data || [];
      this.loading = false;
    }, false, false, false);
  }

  deleteCheckIn(checkIn: any): void {
    const operationHandler = {
      element: 'check_in_boards',
      selected_items: [checkIn._id],
      router: false,
      excludeRedirect: true
    };
    this.sharedFunctions.openDialog('delete', operationHandler, () => {
      this.refresh();
    });
  }

}
