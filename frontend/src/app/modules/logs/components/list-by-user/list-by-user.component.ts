import { Component, OnInit, DoCheck, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                       // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { regexObjectId } from '@env/environment';                                       // Enviroments
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list-by-user',
  templateUrl: './list-by-user.component.html',
  styleUrls: ['./list-by-user.component.css']
})
export class ListByUserComponent implements OnInit, DoCheck {
  //Loader control:
  public loading: boolean = false;
  private initialLoad: boolean = true;
  private previousParams: any = null;
  private previousResponse: any = null;

  //Table to XLSX (SheetJS CE):
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX(this.i18n.instant('LOGS.LIST_BY_USER.EXCEL_SHEET_NAME'), this.table) }

  //Set visible columns of the list:
  public displayedColumns: string[] = ['log_id', 'datetime', 'event', 'fk_user', 'organization', 'ip_client'];

  //Inject services to the constructor:
  constructor(
    private objRoute: ActivatedRoute,
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService,
    private i18n: I18nService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : this.i18n.instant('LOGS.LIST_BY_USER.TITLE'),
      content_icon        : 'format_list_bulleted',
      add_button          : false,
      duplicated_surnames : false,                          // Check duplicated surnames
      nested_element      : false,                          // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : 'datetime',
        status        : false,
        urgency       : false,
        flow_state    : false,
        modality      : false,
        fk_user       : 'user._id',
        log_event     : true,
        pager         : true,
        clear_filters : false   //If you clear the search you will be able to see other users' logs.
      },
      advanced_search : false
    });

    //Set element:
    sharedProp.elementSetter('logs');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.status        = '';
    this.sharedProp.flow_state    = '';
    this.sharedProp.date          = '';
    this.sharedProp.date_range    = {
      start : '',
      end   : ''
    };
    this.sharedProp.modality      = '';
    this.sharedProp.fk_user       = this.sharedProp.userLogged.user_id; //Set fk_user in shared properties filter (Logged user JWT).
    this.sharedProp.log_event     = '';
    this.sharedProp.log_element   = '';

    //Initialize selected items:
    this.sharedProp.selected_items = [];
    this.sharedProp.checked_items = [];

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = ['element.details', 'ip_client', 'organization.short_name'];
    this.sharedProp.projection    = {};
    this.sharedProp.sort          = { datetime: -1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: this.sharedProp.mainSettings.appSettings.default_page_sizes[0] };
    this.sharedProp.group         = false;

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    const id = this.objRoute.snapshot.params['_id'];

    //If have an _id and this is valid ObjectId, change params to findById:
    if(id !== undefined && regexObjectId.test(id)){
      this.sharedProp.params['filter[_id]'] = id;
    }

    //Set loading state before initial request:
    this.loading = true;

    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, (resLogs: any) => {
      //Set loading false when data arrives and initialize base state for change detection:
      this.loading = false;
      this.previousParams = JSON.parse(JSON.stringify(this.sharedProp.params));
      this.previousResponse = this.sharedFunctions.response;
      this.initialLoad = false;
    });
  }

  ngDoCheck(): void {
    //Only execute detection logic after initial load is complete:
    if(this.initialLoad){
      return;
    }

    //Detect changes in request params from action component (indicates new search):
    const currentParamsStr = JSON.stringify(this.sharedProp.params);
    const previousParamsStr = JSON.stringify(this.previousParams);

    if(currentParamsStr !== previousParamsStr){
      //Params changed - set loading to true:
      this.loading = true;
      //Update previous params to current state:
      this.previousParams = JSON.parse(currentParamsStr);
      return; //Exit to avoid checking response in same cycle
    }

    //Detect changes in response (indicates data received):
    if(this.sharedFunctions.response !== this.previousResponse){
      //Update previous response reference:
      this.previousResponse = this.sharedFunctions.response;

      //If response is not null/false, data has arrived - disable loading:
      if(this.sharedFunctions.response){
        this.loading = false;
      }
    }
  }
}
