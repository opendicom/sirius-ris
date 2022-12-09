import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                       // Router and Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';           // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import {                                                                                        // Enviroments
  app_setting,
  regexObjectId,
  ISO_3166,
  document_types,
  gender_types
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list-drafts',
  templateUrl: './list-drafts.component.html',
  styleUrls: ['./list-drafts.component.css']
})
export class ListDraftsComponent implements OnInit {
  //Set component properties:
  public country_codes: any = ISO_3166;
  public document_types: any = document_types;
  public gender_types: any = gender_types;

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'element_action',
    'organization',
    'branch',
    'service',
    'date',
    'schedule',
    'documents',
    'names',
    'surnames',
    'details',
    'urgency'
  ];

  //Inject services to the constructor:
  constructor(
    private router: Router,
    private objRoute: ActivatedRoute,
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : 'Listado de citas en curso',
      content_icon        : 'free_cancellation',
      add_button          : false,
      duplicated_surnames : false,    // Check duplicated surnames
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : 'start-end',
        urgency       : true,
        flow_state    : false,
        status        : false,
        modality      : 'modality._id', //FK name in schema
        pager         : true,
        clear_filters : true
      }
    });

    //Set element:
    sharedProp.elementSetter('appointments_drafts');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.status        = '';
    this.sharedProp.flow_state    = '';
    this.sharedProp.date          = '';
    this.sharedProp.date_range = {
      start : '',
      end   : ''
    };
    this.sharedProp.modality      = '';

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
      'procedure.name',
      'slot.equipment.name'
    ];
    this.sharedProp.projection    = {
      'imaging.organization.short_name': 1,
      'imaging.branch.short_name': 1,
      'imaging.service.name': 1,
      'start': 1,
      'end': 1,
      'urgency': 1,
      'procedure.name': 1,
      'procedure.code': 1,
      'procedure.informed_consent': 1,
      'modality.code_meaning': 1,
      'modality.code_value': 1,
      'slot.equipment.name':1,
      'slot.equipment.AET':1,
      'patient.person.documents': 1,
      'patient.person.name_01': 1,
      'patient.person.name_02': 1,
      'patient.person.surname_01': 1,
      'patient.person.surname_02': 1,
      'patient.person.gender': 1,
      'patient.person.birth_date': 1,
      'patient.status': 1,
      'coordinator.person.name_01': 1,
      'coordinator.person.name_02': 1,
      'coordinator.person.surname_01': 1,
      'coordinator.person.surname_02': 1
    };
    this.sharedProp.sort          = { 'urgency': 1, 'status': 1, 'imaging.organization._id': 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: app_setting.default_page_sizes[0] };

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    const id = this.objRoute.snapshot.params['_id'];

    //If the user is not role superuser or admin search only the draft appointments of the current user:
    if(this.sharedProp.userLogged.permissions[0].role !== 1 && this.sharedProp.userLogged.permissions[0].role !== 2){
      this.sharedProp.params['filter[coordinator._id]'] = this.sharedProp.userLogged.user_id;
    }

    //If have an _id and this is valid ObjectId, change params to findById:
    if(id !== undefined && regexObjectId.test(id)){
      this.sharedProp.params['filter[_id]'] = id;
    }

    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }

  deleteAppointmentsDrafts(appointment_draft: any){
    //Create operation handler:
    const operationHandler = {
      element           : 'appointments_drafts',
      appointment_draft : appointment_draft
    }

    //Open dialog to confirm:
    this.sharedFunctions.openDialog('delete_appointment_draft', operationHandler, (res) => {
      //Reload a component:
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.router.onSameUrlNavigation = 'reload';

      //Redirect to list element:
      this.router.navigate(['/appointments/list_drafts']);
    });
  }

  resumeAppointmentDraft(_id: string){
    //Check if element is not empty:
    if(_id !== '' && _id !== undefined && _id !== null && regexObjectId.test(_id)){
      //Request params:
      const params = {
        'filter[_id]': _id,

        //Projection:
        'proj[start]': 1,
        'proj[end]': 1,
        'proj[urgency]': 1,
        'proj[friendly_pass]': 1,

        //Projection - Patient:
        'proj[patient._id]': 1,
        'proj[patient.fk_person]': 1,
        'proj[patient.status]': 1,

        //Projection - Patient -> Person:
        'proj[patient.person._id]': 1,
        'proj[patient.person.documents]': 1,
        'proj[patient.person.name_01]': 1,
        'proj[patient.person.name_02]': 1,
        'proj[patient.person.surname_01]': 1,
        'proj[patient.person.surname_02]': 1,
        'proj[patient.person.birth_date]': 1,
        'proj[patient.person.gender]': 1,

        //Projection - Imaging:
        'proj[imaging.organization._id]': 1,
        'proj[imaging.organization.short_name]': 1,
        'proj[imaging.branch._id]': 1,
        'proj[imaging.branch.short_name]': 1,
        'proj[imaging.service._id]': 1,
        'proj[imaging.service.name]': 1,

        //Projection - Modality:
        'proj[modality._id]': 1,
        'proj[modality.code_meaning]': 1,
        'proj[modality.code_value]': 1,

        //Projection - Procedure:
        'proj[procedure]': 1,

        //Projection - Slot:
        'proj[slot._id]': 1,

        //Projection - Slot -> Equipment:
        'proj[slot.equipment.name]': 1,
        'proj[slot.equipment.AET]': 1
      };

      //Find corrdinations in progress:
      this.sharedFunctions.find('appointments_drafts', params, (res) => {
        //Check operation status:
        if(res.success === true){
          //Set sharedProp current data:
          //Current Patient:
          this.sharedProp.current_patient = {
            _id       : res.data[0].patient._id,
            status    : res.data[0].patient.status,
            fk_person : res.data[0].patient.fk_person,
            person    : res.data[0].patient.person
          };

          //Current Imaging:
          this.sharedProp.current_imaging = res.data[0].imaging;

          //Current Modality:
          this.sharedProp.current_modality = res.data[0].modality;

          //Current Procedure:
          this.sharedProp.current_procedure = res.data[0].procedure;

          //Current Slot:
          this.sharedProp.current_slot = res.data[0].slot._id;

          //Current Equipment:
          this.sharedProp.current_equipment = {
            details: {
              name  : res.data[0].slot.equipment.name,
              AET   : res.data[0].slot.equipment.AET
            }
          };

          //Current Datetime:
          this.sharedProp.current_datetime = this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].start), new Date(res.data[0].end));

          //Current Urgency:
          this.sharedProp.current_urgency = res.data[0].urgency;

          //Clear previous friendly passwords:
          this.sharedProp.current_friendly_pass = '';

          //Add friendly password if it exists in the draft:
          if(res.data[0].friendly_pass){
            if(res.data[0].friendly_pass !== ''){
              this.sharedProp.current_friendly_pass = res.data[0].friendly_pass;
            }
          }

          //Current appointment draft:
          this.sharedProp.current_appointment_draft = res.data[0]._id;

          //Redirect to appointments  form-insert:
          this.router.navigate(['/appointments/form/insert']);

        } else {
          //Send error message:
          this.sharedFunctions.sendMessage('Error al intentar editar el elemento con _id: ' + _id  + ' Contactese con su administrador para ver más detalles.');
        }
      }, true);
    }
  }
}
