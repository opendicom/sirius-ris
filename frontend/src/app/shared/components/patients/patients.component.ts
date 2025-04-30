import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                       // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { PdfService } from '@shared/services/pdf.service';                              // PDF Service
import {                                                                                // Enviroments
  regexObjectId,
  ISO_3166,
  document_types,
  performing_flow_states,
  cancellation_reasons
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
  @ViewChild('hiddenLink') hiddenLink!: ElementRef;

  //Set component properties:
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public performing_flow_states : any = performing_flow_states;
  public cancellation_reasons   : any = cancellation_reasons;

  //Initializate ohifPath:
  public ohifPath               : string = '';
  public dicomZipURL            : string = '';

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'element_action',
    'date',
    'checkin_time',
    'documents',
    'names',
    'surnames',
    'details'
  ];

  //Inject services to the constructor:
  constructor(
    private objRoute        : ActivatedRoute,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public pdfService       : PdfService
  ) {
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : 'Resultado de estudios',
      content_icon        : 'fact_check',
      add_button          : false,
      duplicated_surnames : false,                          // Check duplicated surnames
      nested_element      : false,                          // Set nested element
      filters_form        : true,
      filters : {
        search        : false,
        date          : false,
        date_range    : 'date',
        urgency       : false,
        status        : false,
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
    sharedProp.elementSetter('performing');

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
    this.sharedProp.regex         = 'false';
    this.sharedProp.filterFields  = [];
    this.sharedProp.projection    = {
      'appointment.imaging': 1,
      'appointment.referring': 1,
      'appointment.reporting': 1,
      'appointment.cancellation_reasons': 1,
      'appointment.outpatient': 1,
      'appointment.inpatient': 1,
      'appointment.urgency': 1,
      'appointment.attached_files._id': 1,    //Only _id and name for performing downloads dialog.
      'appointment.attached_files.name': 1,   //Only _id and name for performing downloads dialog.
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

  getStudyDICOM(fk_performing: string, accessType: string){
    //Request DICOM image query path:
    this.sharedFunctions.wezenStudyToken(fk_performing, accessType, (wezenStudyTokenRes) => {
      if(wezenStudyTokenRes.success === true){
        //Switch by accessType:
        switch(accessType){
          case 'ohif':
            //Set ohifPath:
            this.ohifPath = wezenStudyTokenRes.path;
            break;

          case 'dicom.zip':
            // Create a link from Javascript:
            // Prevent the Angular Router from handling the path when the click event is triggered.
            const a = document.createElement('a');
            a.href = wezenStudyTokenRes.path; //Set dicomZipURL:
            a.rel = 'noopener';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            break;
        }
      } else {
        //Send Console Warn Message:
        console.warn('Error al intentar buscar las imágenes DICOM del elemento: ' + wezenStudyTokenRes.message);
      }
    });
  }

  clearOHIFPath(){
    this.ohifPath = '';
  }
}
