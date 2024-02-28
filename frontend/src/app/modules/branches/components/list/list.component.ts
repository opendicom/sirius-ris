import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                             // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';         // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';           // Shared Functions
import { ISO_3166, regexObjectId } from '@env/environment';                                   // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  public country_codes    : any = ISO_3166;

  //Table to XLSX (SheetJS CE):
  private excludedColumns = ['Acciones', 'País'];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX('sucursales', this.table, this.excludedColumns) }

  //Set visible columns of the list:
  public displayedColumns: string[] = ['element_action', 'organization', 'short_name', 'name', 'OID', 'country_code', 'structure_id', 'suffix', 'status'];

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
      content_title       : 'Listado de sucursales',
      content_icon        : 'account_tree',
      add_button          : '/branches/form/insert/0',    // Zero indicates empty :id (Activated Route) [content is ignored]
      duplicated_surnames : false,                        // Check duplicated surnames
      nested_element      : false,                        // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : false,
        urgency       : false,
        flow_state    : false,
        status        : true,
        modality      : false,
        fk_user       : false,
        log_event     : false,
        pager         : true,
        clear_filters : true
      },
      advanced_search : false
    });

    //Set element:
    sharedProp.elementSetter('branches');

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
    this.sharedProp.filterFields  = ['name', 'short_name', 'OID', 'structure_id', 'suffix', 'organization.short_name'];
    this.sharedProp.projection    = {
      'fk_organization': 1,
      'name': 1,
      'short_name': 1,
      'OID': 1,
      'country_code': 1,
      'structure_id': 1,
      'suffix': 1,
      'status': 1,
      'organization.short_name': 1
    };
    this.sharedProp.sort          = { status: -1 };
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
