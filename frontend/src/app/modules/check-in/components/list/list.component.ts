import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';             // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';               // Shared Functions
import { app_setting, ISO_3166, document_types, gender_types } from '@env/environment';           // Enviroments
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

  //Initialize repetition controller:
  public repetitionController: any = {
    repeatedSurnames  : {},
    allSurnames       : [],
  }

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'order',
    'element_action',
    'schedule',
    'documents',
    'names',
    'surnames',
    'details',
    'outpatient_inpatient',
    'urgency'
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
      content_title       : 'Recepción de pacientes',
      content_icon        : 'today',
      add_button          : false,
      filters_form        : true,
      filters : {
        search        : true,
        date          : 'start-end',
        date_range    : false,
        urgency       : false,
        status        : false,
        flow_state    : false,
        modality      : 'modality._id', //FK name in schema
        pager         : false,
        clear_filters : false
      }
    });

    //Set element:
    sharedProp.elementSetter('appointments');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.flow_state    = 'A01';
    this.sharedProp.status        = 'true';
    this.sharedProp.date          = new Date();
    this.sharedProp.date_range = {
      start : '',
      end   : '',
    };
    this.sharedProp.modality      = '';

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = [
      'patient.person.documents.document',
      'patient.person.name_01',
      'patient.person.name_02',
      'patient.person.surname_01',
      'patient.person.surname_02'
    ];
    this.sharedProp.projection    = {
      'start': 1,
      'end': 1,
      'accession_number': 1,
      'flow_state': 1,
      'outpatient': 1,
      'inpatient': 1,
      'patient': 1,
      'urgency': 1,
      'slot.equipment.name': 1,
      'slot.equipment.AET': 1,
      'procedure.name': 1,
      'procedure.code': 1
    };
    this.sharedProp.sort          = { 'start': 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: app_setting.check_in_default_size };

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    this.setDefaultModality();
  }

  setDefaultModality(){
    let element = 'modalities';
    let params : any = { 'filter[status]': true, 'proj[_id]': 1 };
    let findOne = true;

    //Check if the user is logged in at the service level:
    if(this.sharedProp.userLogged.permissions[0].type === 'service'){
      element = 'services';
      params  = { 'filter[_id]': this.sharedProp.userLogged.permissions[0].domain, 'proj[modality]': 1 };
      findOne = false;
    }

    //Find and set default modality:
    this.sharedFunctions.find(element, params, (res) => {
      //Check result:
      if(res.success === true){

        //Check if the user is logged in at the service level:
        switch(element){
          case 'modalities':
            //Set default Modality (First match - findOne):
            this.sharedProp.modality = res.data[0]._id;
            break;

          case 'services':
            //Set default Modality (First match - findOne):
            this.sharedProp.modality = res.data[0].modality._id;
            break;
        }

        //Refresh request params:
        this.sharedProp.paramsRefresh();

        //First search (List):
        this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, async (res) => {

          //Clear all surnames in repetition controller:
          this.repetitionController.allSurnames = [];

          //Keep all surnames:
          await Promise.all(Object.keys(res.data).map((key) => {
            this.repetitionController.allSurnames.push(res.data[key].patient.person.surname_01);

            if(res.data[key].patient.person.surname_02 !== '' && res.data[key].patient.person.surname_02 !== undefined && res.data[key].patient.person.surname_02 !== null){
              this.repetitionController.allSurnames.push(res.data[key].patient.person.surname_02);
            }
          }));

          //Count repeated surnames:
          this.repetitionController.repeatedSurnames = await this.sharedFunctions.arrayCountValues(this.repetitionController.allSurnames);
        });

      } else {
        //Send message:
        this.sharedFunctions.sendMessage('Hubo un problema al determinar la modalidad por defecto.');
      }
    }, findOne);
  }

  mwlResend(fk_appointment: string, accession_number: string){
    //Create operation handler:
    const operationHandler = {
      accession_number  : accession_number
    };

    //Open dialog to decide what operation to perform:
    this.sharedFunctions.openDialog('mwl_resend', operationHandler, (result) => {
      //Check if result is true:
      if(result){
        this.sharedFunctions.sendToMWL(fk_appointment, true, { element: this.sharedProp.element, params: this.sharedProp.params });
      }
    });
  }
}