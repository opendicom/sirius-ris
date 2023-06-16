import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                       // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { app_setting, regexObjectId } from '@env/environment';                          // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set visible columns of the list:
  public displayedColumns: string[] = ['element_action', 'organization', 'branch', 'name', 'modality', 'equipments', 'code', 'informed_consent', 'status'];

  //Table to XLSX (SheetJS CE):
  private excludedColumns = ['Acciones'];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX('procedimientos', this.table, this.excludedColumns) }

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
      content_title       : 'Listado de procedimientos',
      content_icon        : 'format_list_numbered',
      add_button          : '/procedures/form/insert/0',    // Zero indicates empty :id (Activated Route) [content is ignored]
      duplicated_surnames : false,                          // Check duplicated surnames
      nested_element      : false,                          // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : false,
        status        : true,
        urgency       : false,
        flow_state    : false,
        modality      : 'modality._id', //FK name in schema
        fk_user       : false,
        log_event     : false,
        pager         : true,
        clear_filters : true
      }
    });

    //Set element:
    sharedProp.elementSetter('procedures');

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
    this.sharedProp.filterFields  = ['organization.short_name', 'branch.short_name', 'name', 'code', 'equipments.details.name'];
    this.sharedProp.projection    = {
      'domain': 1,
      'name': 1,
      'code': 1,
      'organization.short_name': 1,
      'branch.short_name': 1,
      'modality.code_value': 1,
      'modality.code_meaning': 1,
      'equipments.duration': 1,
      'equipments.details.name': 1,
      'equipments.details.AET': 1,
      'informed_consent': 1,
      'status': 1
    };
    this.sharedProp.sort          = { 'organization.short_name': 1, 'branch.short_name': 1, name: 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: app_setting.default_page_sizes[0] };

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
