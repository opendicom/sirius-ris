import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                               // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';           // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import {                                                                                        // Enviroments
  default_page_sizes,
  regexObjectId,
  appointments_flow_states,
  ISO_3166,
  document_types,
  gender_types
} from '@env/environment';
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
  public appointmentsFlowStates: any = appointments_flow_states;

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'element_action',
    'flow_state',
    'date',
    'schedule',
    'documents',
    'names',
    'surnames',
    'equipment',
    'modality',
    'urgency',
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
      content_title   : 'Listado de citas',
      content_icon    : 'event_available',
      add_button      : '/appointments/set_patient',
      filters_form    : true,
      filters : {
        search        : true,
        date_range    : 'start-end',
        urgency       : true,
        status        : true,
        pager         : true,
      }
    });

    //Set element:
    sharedProp.elementSetter('appointments');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.status        = '';
    this.sharedProp.date_range = {
      start : '',
      end   : ''
    };

    //Initialize selected items:
    this.sharedProp.selected_items = [];
    this.sharedProp.checked_items = [];

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = [
      'patient.person.documents.document',
      'patient.person.name_01',
      'patient.person.name_02',
      'patient.person.surname_01',
      'patient.person.surname_02',
      'slot.equipment.name',
      'modality.code_value'
    ];
    this.sharedProp.projection    = {
      'imaging': 1,
      'referring': 1,
      'reporting': 1,
      'start': 1,
      'end': 1,
      'flow_state': 1,
      'outpatient': 1,
      'inpatient': 1,
      'patient': 1,
      'urgency': 1,
      'status': 1,
      'slot.equipment.name': 1,
      'slot.equipment.AET': 1,
      'modality': 1
    };
    this.sharedProp.sort          = { 'urgency': 1, 'status': 1, 'imaging.organization._id': 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: default_page_sizes[0] };

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
