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
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, DoCheck {
  //Set visible columns of the list:
  public displayedColumns: string[] = ['select_element', 'element_action', 'organization', 'branch', 'service', 'date_name', 'date', 'schedule', 'equipment', 'modality', 'urgency'];

  //Loading state management:
  public loading: boolean = false;
  private initialLoad: boolean = true;
  private previousParams: any;
  private previousResponse: any;

  //Table to XLSX (SheetJS CE):
  private excludedColumns = [this.i18n.instant('SLOTS.LIST.EXCLUDED_COLUMNS_XLSX')];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX(this.i18n.instant('SLOTS.LIST.EXCEL_SHEET_NAME'), this.table, this.excludedColumns) }

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
      content_title       : this.i18n.instant('SLOTS.LIST.TITLE'),
      content_icon        : 'date_range',
      add_button          : '/slots/form/insert/0',   // Zero indicates empty :id (Activated Route) [content is ignored]
      add_slots_batch     : '/slots/batch',
      duplicated_surnames : false,                    // Check duplicated surnames
      nested_element      : false,                    // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : 'start-end',
        status        : false,
        flow_state    : false,
        urgency       : true,
        modality      : 'modality._id', //FK name in schema
        fk_user       : false,
        log_event     : false,
        pager         : true,
        clear_filters : true
      },
      advanced_search : false
    });

    //Set element:
    sharedProp.elementSetter('slots');

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
    this.sharedProp.fk_user       = '';
    this.sharedProp.log_event     = '';
    this.sharedProp.log_element   = '';

    //Initialize selected items:
    this.sharedProp.selected_items = [];
    this.sharedProp.checked_items = [];

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = ['organization.short_name', 'branch.short_name', 'service.name', 'equipment.name'];
    this.sharedProp.projection    = {
      'domain': 1,
      'fk_equipment': 1,
      'start': 1,
      'end': 1,
      'urgency': 1,
      'organization.short_name': 1,
      'branch.short_name': 1,
      'service.name': 1,
      'equipment.name': 1,
      'equipment.AET': 1,
      'modality.code_value': 1,
      'modality.code_meaning': 1
    };
    this.sharedProp.sort          = { start: -1 };
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

    //Set loading state:
    this.loading = true;

    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, resSlots => {
      //Set loading to false when data is received:
      this.loading = false;

      //Initialize base state for change detection after initial load:
      this.previousParams = JSON.parse(JSON.stringify(this.sharedProp.params));
      this.previousResponse = this.sharedFunctions.response;

      //Mark initial load as complete:
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
      return;
    }
    if(this.sharedFunctions.response !== this.previousResponse){
      this.previousResponse = this.sharedFunctions.response;
      if(this.sharedFunctions.response){
        //Response received - mark loading as complete:
        this.loading = false;
      }
    }
  }
}
