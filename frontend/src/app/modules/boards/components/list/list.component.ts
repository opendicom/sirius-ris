import { Component, OnInit } from '@angular/core';

import { I18nService } from '@shared/services/i18n.service';
import { SharedPropertiesService } from '@shared/services/shared-properties.service';
import { SharedFunctionsService } from '@shared/services/shared-functions.service';

@Component({
  selector: 'app-boards-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  // The table columns match the board fields returned by the aggregation handler.
  public displayedColumns: string[] = ['element_action', 'name', 'details', 'branch'];
  public loading: boolean = false;

  constructor(
    private i18n: I18nService,
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ) {
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();
    this.sharedProp.actionSetter({
      content_title: this.i18n.instant('BOARDS.LIST.TITLE'),
      content_icon: 'tv',
      add_button: '/boards/form/insert/0',
      duplicated_surnames: false,
      nested_element: false,
      filters_form: true,
      filters: {
        search: true,
        date: false,
        date_range: false,
        status: false,
        urgency: false,
        flow_state: false,
        modality: false,
        fk_user: false,
        log_event: false,
        pager: true,
        clear_filters: true
      },
      advanced_search: false
    });
    this.sharedProp.elementSetter('boards');
    this.sharedProp.filter = '';
    this.sharedProp.status = '';
    this.sharedProp.urgency = '';
    this.sharedProp.flow_state = '';
    this.sharedProp.date = '';
    this.sharedProp.date_range = { start: '', end: '' };
    this.sharedProp.modality = '';
    this.sharedProp.fk_user = '';
    this.sharedProp.log_event = '';
    this.sharedProp.log_element = '';
    this.sharedProp.selected_items = [];
    this.sharedProp.checked_items = [];
    this.sharedProp.filterFields = ['name', 'details', 'branch.name'];
    this.sharedProp.projection = { name: 1, details: 1, branch: 1 };
    this.sharedProp.sort = { name: 1 };
    this.sharedProp.pager = { page_number: 1, page_limit: this.sharedProp.mainSettings.appSettings.default_page_sizes[0] };
    this.sharedProp.group = false;
    this.sharedProp.regex = 'true';
    this.sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    // The shared action component owns search and pagination requests for this list.
    this.loading = true;
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, () => {
      this.loading = false;
    });
  }

  deleteBoard(board: any): void {
    // Reuse the standard dialog so the configured deletion code is collected.
    const operationHandler = {
      element: 'boards',
      selected_items: [board._id],
      router: false,
      excludeRedirect: true
    };
    this.sharedFunctions.openDialog('delete', operationHandler, () => {
      this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
    });
  }
}