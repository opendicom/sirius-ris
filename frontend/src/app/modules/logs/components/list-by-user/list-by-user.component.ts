import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                       // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import {                                                                                // Enviroments
  regexObjectId, 
  events_log, 
  elementTypesLang
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list-by-user',
  templateUrl: './list-by-user.component.html',
  styleUrls: ['./list-by-user.component.css']
})
export class ListByUserComponent implements OnInit {
  //Set component properties:
  public eventsLog: any = events_log;
  public elementTypesLang : any = elementTypesLang;

  //Table to XLSX (SheetJS CE):
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX('logs', this.table) }

  //Set visible columns of the list:
  public displayedColumns: string[] = ['log_id', 'datetime', 'event', 'fk_user', 'organization', 'ip_client'];

  //Inject services to the constructor:
  constructor(
    private objRoute: ActivatedRoute,
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : 'Listado de logs del usuario',
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

    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }
}
