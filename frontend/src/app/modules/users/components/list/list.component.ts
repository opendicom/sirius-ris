import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                           // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  ISO_3166, 
  user_roles, 
  document_types, 
  gender_types, 
  regexObjectId
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set component properties:
  public country_codes  : any = ISO_3166;
  public document_types : any = document_types;
  public gender_types   : any = gender_types;
  public user_roles     : any = user_roles;

  //Table to XLSX (SheetJS CE):
  private excludedColumns = ['Acciones'];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX('usuarios', this.table, this.excludedColumns) }

  //Set visible columns of the list:
  displayedColumns: string[] = [
    'element_action',
    'documents',
    'names',
    'surnames',
    'birth_date',
    'email',
    'phone_numbers',
    'role',
    'gender',
    'type',
    'status'
  ];

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
      content_title       : 'Listado de usuarios',
      content_icon        : 'people',
      add_button          : '/users/form/insert/0',           // Zero indicates empty :id (Activated Route) [content is ignored]
      add_machine         : '/users/form_machine/insert/0',   // Zero indicates empty :id (Activated Route) [content is ignored]
      duplicated_surnames : false,                            // Check duplicated surnames
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : false,
        status        : true,
        urgency       : false,
        flow_state    : false,
        modality      : false,
        fk_user       : false,
        log_event     : false,
        pager         : true,
        clear_filters : true
      },
      advanced_search : false
    });

    //Set element:
    sharedProp.elementSetter('users');

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
    this.sharedProp.filterFields  = [
      'person.documents.document',
      'username',
      'email',
      'person.name_01',
      'person.name_02',
      'person.surname_01',
      'person.surname_02',
      'person.phone_numbers'
    ];
    this.sharedProp.projection    = {
      'fk_person': 1,
      'person': 1,
      'username': 1,
      'email': 1,
      'status': 1,
      'permissions': 1
    };
    this.sharedProp.sort          = { username: 1 };
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
