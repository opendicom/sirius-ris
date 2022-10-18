import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';             // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';               // Shared Functions
import { ISO_3166, document_types, gender_types, check_in_default_size } from '@env/environment'; // Enviroments
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
    this.sharedProp.projection    = {};
    this.sharedProp.sort          = { 'procedure.name': 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: check_in_default_size };

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    this.setDefaultModality();
  }

  setDefaultModality(){
    this.sharedFunctions.find('modalities', { 'filter[status]': true, 'proj[_id]': 1 }, (res) => {
      //Check result:
      if(res.success === true){
        //Set default Modality (First match - findOne):
        this.sharedProp.modality = res.data[0]._id;

        //Refresh request params:
        this.sharedProp.paramsRefresh();

        //First search (List):
        this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
      } else {
        this.sharedFunctions.sendMessage('Hubo un problema al determinar la modalidad por defecto.');
      }
    }, true);
  }

}
