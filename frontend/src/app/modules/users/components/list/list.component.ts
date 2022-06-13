import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';             // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';               // Shared Functions
import { ISO_3166, document_types, gender_types, default_page_sizes } from '@env/environment';    // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set component properties:
  public country_codes: any = ISO_3166;
  public document_types: any = document_types;
  public gender_types: any = gender_types;

  //Set visible columns of the list:
  displayedColumns: string[] = [
    'element_action',
    'documents',
    'names',
    'surnames',
    'birth_date',
    'email',
    'phone_numbers',
    'gender',
    'type',
    'status'
  ];

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title   : 'Listado de usuarios',
      content_icon    : 'people',
      add_button      : '/users/form/insert/0', //Zero indicates empty :id (Activated Route) [content is ignored]
      filters_form    : true,
      filters : {
        search        : true,
        date_range    : false,
        status        : true,
        pager         : true,
      }
    });

    //Set element:
    sharedProp.elementSetter('users');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.status        = '';

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = [
      'person.documents.document',
      'username',
      'person.name_01',
      'person.name_02',
      'person.surname_01',
      'person.surname_02',
      'person.email',
      'person.phone_numbers'
    ];
    this.sharedProp.projection    = {
      'fk_person': 1,
      'person': 1,
      'username': 1,
      'status': 1
    };
    this.sharedProp.sort          = { status: -1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: default_page_sizes[0] };

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }
}
