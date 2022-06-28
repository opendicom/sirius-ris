import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { default_page_sizes } from '@env/environment';                                  // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set visible columns of the list:
  public displayedColumns: string[] = ['element_action', 'organization', 'branch', 'name', 'modality', 'equipments', 'status'];

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title   : 'Listado de servicios',
      content_icon    : 'health_and_safety',
      add_button      : '/services/form/insert/0', //Zero indicates empty :id (Activated Route) [content is ignored]
      filters_form    : true,
      filters : {
        search        : true,
        date_range    : false,
        status        : true,
        pager         : true,
      }
    });

    //Set element:
    sharedProp.elementSetter('services');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.status        = '';

    //Initialize selected items:
    this.sharedProp.selected_items = [];

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = ['name', 'organization.short_name', 'branch.short_name', 'modality.code_value', 'equipments.name', 'equipments.AET'];
    this.sharedProp.projection    = {
      'fk_branch': 1,
      'fk_modality': 1,
      'name': 1,
      'status': 1,
      'organization.short_name': 1,
      'branch.short_name': 1,
      'modality.code_value': 1,
      'modality.code_meaning': 1,
      'equipments.name': 1,
      'equipments.AET': 1
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
