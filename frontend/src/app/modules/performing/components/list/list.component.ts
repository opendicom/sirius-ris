import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                               // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';           // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import { PdfService } from '@shared/services/pdf.service';                                      // PDF Service
import {                                                                                        // Enviroments
  app_setting,
  regexObjectId,
  performing_flow_states,
  ISO_3166,
  document_types,
  gender_types,
  cancellation_reasons
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set component properties:
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public gender_types           : any = gender_types;
  public performing_flow_states : any = performing_flow_states;
  public cancellation_reasons   : any = cancellation_reasons;

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'element_action',
    'flow_state',
    'date',
    'checkin_time',
    'documents',
    'names',
    'surnames',
    'patient_age',
    'details',
    'outpatient_inpatient',
    'urgency',
    'status',
    'domain'
  ];

  //Inject services to the constructor:
  constructor(
    private objRoute        : ActivatedRoute,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public pdfService       : PdfService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : 'Listado de estudios',
      content_icon        : 'assignment_ind',
      add_button          : false,
      duplicated_surnames : true,     // Check duplicated surnames
      nested_element      : false,    // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : 'start-end',
        urgency       : true,
        status        : true,
        flow_state    : true,
        modality      : 'modality._id',   //FK name in schema
        pager         : true,
        clear_filters : true
      }
    });

    //Set element:
    sharedProp.elementSetter('performing');

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
      'appointment.imaging.organization.short_name',
      'appointment.imaging.branch.short_name',
      'appointment.imaging.service.name',

      'appointment.referring.organization.short_name',
      'appointment.referring.branch.short_name',
      'appointment.referring.service.name',

      'appointment.reporting.organization.short_name',
      'appointment.reporting.branch.short_name',
      'appointment.reporting.service.name',

      'patient.person.documents.document',
      'patient.person.name_01',
      'patient.person.name_02',
      'patient.person.surname_01',
      'patient.person.surname_02',

      'procedure.name',
      'equipment.name'
    ];
    this.sharedProp.projection    = {
      'appointment.imaging': 1,
      'appointment.referring': 1,
      'appointment.reporting': 1,
      'appointment.cancellation_reasons': 1,
      'appointment.outpatient': 1,
      'appointment.inpatient': 1,
      'appointment.urgency': 1,
      'fk_appointment': 1,
      'date': 1,
      'flow_state': 1,
      'patient': 1,
      'status': 1,
      'equipment.name': 1,
      'equipment.AET': 1,
      'procedure.name': 1,
      'procedure.code': 1,
      'modality': 1
    };
    this.sharedProp.sort          = { 'date': -1, 'urgency': 1, 'status': -1, 'appointment.imaging.organization._id': 1 };
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

  reportReview(fk_performing: string){
    //Initializate amendmentsData:
    let amendmentsData : any = false;

    //Set params:
    const params = {
      'filter[fk_performing]'       : fk_performing,

      //Project only report content, not performing content (multiple reports | amendments):
      'proj[clinical_info]'         : 1,
      'proj[procedure_description]' : 1,
      'proj[findings]'              : 1,
      'proj[summary]'               : 1,
      'proj[medical_signatures]'    : 1,
      'proj[authenticated]'         : 1,
      'proj[pathologies]'           : 1,
      'proj[createdAt]'             : 1,

      //Make sure the first report is the most recent:
      'sort[createdAt]'             : -1
    };

    //Find reports by fk_performing:
    this.sharedFunctions.find('reports', params, async (reportsRes) => {
      //Check operation status:
      if(reportsRes.success === true){
        //Check amend cases:
        if(this.sharedFunctions.getKeys(reportsRes.data, false, true).length > 1){
          //Set history report data object (Clone objects with spread operator):
          amendmentsData = [... reportsRes.data];

          //Delete current report from the history (first element):
          amendmentsData.shift();
        }

        //Create operation handler:
        const operationHandler = {
          last_report     : reportsRes.data[0], //Set report data with the last report (amend cases)
          amendments_data : amendmentsData
        };

        //Open dialog to decide what operation to perform:
        this.sharedFunctions.openDialog('report_review', operationHandler, (result) => {
          console.log(result);
        });

      } else {
        //Return to the list with request error message:
        this.sharedFunctions.sendMessage('Error al intentar insertar revisar el informe: ' + reportsRes.message);
      }
    }, false, false, false);
  }

}
