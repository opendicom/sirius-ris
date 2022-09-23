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
      content_title       : 'Listado de citas',
      content_icon        : 'event_available',
      add_button          : '/appointments/set_patient',
      appointments_drafts : false,
      filters_form        : true,
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
    //Check appointments_drafts (coordinations in progress to enable or disable add button):
    this.checkAppointmentsDrafts();

    //Extract sent data (Parameters by routing):
    const id = this.objRoute.snapshot.params['_id'];

    //If have an _id and this is valid ObjectId, change params to findById:
    if(id !== undefined && regexObjectId.test(id)){
      this.sharedProp.params['filter[_id]'] = id;
    }

    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }

  checkAppointmentsDrafts(){
    //Preserve add_buton value:
    const add_button_value = this.sharedProp.action['add_button'];

    //Set params:
    const params = {
      'filter[coordinator._id]': this.sharedProp.userLogged.user_id,

      //Projection:
      'proj[imaging.organization.short_name]': 1,
      'proj[imaging.branch.short_name]': 1,
      'proj[imaging.service.name]': 1,
      'proj[start]': 1,
      'proj[end]': 1,
      'proj[urgency]': 1,
      'proj[procedure.name]': 1,
      'proj[procedure.informed_consent]': 1,
      'proj[modality.code_meaning]': 1,
      'proj[modality.code_value]': 1,
      'proj[slot.equipment.name]':1,
      'proj[slot.equipment.AET]':1,
      'proj[patient.person.documents]': 1,
      'proj[patient.person.name_01]': 1,
      'proj[patient.person.name_02]': 1,
      'proj[patient.person.surname_01]': 1,
      'proj[patient.person.surname_02]': 1,
      'proj[patient.person.gender]': 1,
      'proj[patient.person.birth_date]': 1,
      'proj[patient.status]': 1,
      'proj[coordinator.person.name_01]': 1,
      'proj[coordinator.person.name_02]': 1,
      'proj[coordinator.person.surname_01]': 1,
      'proj[coordinator.person.surname_02]': 1
    }

    //Find corrdinations in progress:
    this.sharedFunctions.find('appointments_drafts', params, (res) => {

      //Check operation result:
      if(res.success === true && Object.keys(res.data).length > 0){
        //Disable add buton:
        this.sharedProp.action['add_button'] = false;

        //Enable appointments drafts buttons:
        this.sharedProp.action['appointments_drafts'] = res.data[0];

      } else {
        //Enable add buton (Set preserved value):
        this.sharedProp.action['add_button'] = add_button_value;

        //Disable appointments drafts buttons:
        this.sharedProp.action['appointments_drafts'] = false;
      }
    }, true);
  }
}
