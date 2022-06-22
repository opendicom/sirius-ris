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
  public displayedColumns: string[] = ['element_action', 'organization', 'branch', 'service', 'date_name', 'date', 'schedule', 'equipment', 'modality', 'urgency'];

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title   : 'Listado de turnos',
      content_icon    : 'date_range',
      add_button      : '/slots/form/insert/0', //Zero indicates empty :id (Activated Route) [content is ignored]
      add_slots_batch : '/slots/batch',
      filters_form    : true,
      filters : {
        search        : true,
        date_range    : 'range',
        urgency       : true,
        pager         : true,
      }
    });

    //Set element:
    sharedProp.elementSetter('slots');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.date_range = {
      start : '',
      end   : ''
    };

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = ['organization.short_name', 'branch.short_name', 'service.name', 'modality.code_value', 'equipments.name'];
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
    this.sharedProp.pager         = { page_number: 1, page_limit: default_page_sizes[0] };

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }

}
