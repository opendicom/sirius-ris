import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                                   // Router
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';       // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  regexObjectId,
  ISO_3166,
  document_types,
  gender_types,
  self_management,
  FullCalendarOptions,
  CKEditorConfig
} from '@env/environment';
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';               // CKEditor
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  //Create CKEditor component and configure them:
  public customEditor = customBuildEditor;
  public editorConfig = CKEditorConfig;

  //Set component properties:
  public country_codes  : any = ISO_3166;
  public document_types : any = document_types;
  public gender_types   : any = gender_types;

  //Set organization self management:
  public selfManagement : any = self_management;

  //Min and max dates:
  public minDate: Date;
  public maxDate: Date;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services, components and router to the constructor:
  constructor(
    private router: Router,
    public formBuilder: FormBuilder,
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService
  ) {
    //--------------------------------------------------------------------------------------------------------------------//
    // TEST:
    //--------------------------------------------------------------------------------------------------------------------//
    this.sharedProp.current_patient = { "_id": "62bef5cc67d1c30013f612f4", "status": true, "fk_person": "62bc68f266d77500136f5a32", "email": "milhouse.vanhouten@gmail.com", "permissions": [ { "concession": [], "organization": "6220b26e0feaeeabbd5b0d93", "role": 2 } ], "settings": [], "createdAt": "2022-07-01T13:25:32.539Z", "updatedAt": "2022-08-10T17:41:20.655Z", "__v": 0, "person": { "_id": "62bc68f266d77500136f5a32", "phone_numbers": [ "099654283", "24819374" ], "documents": [ { "doc_country_code": "858", "doc_type": 1, "document": "12345672" } ], "name_01": "MILHOUSE", "surname_01": "VAN HOUTEN", "birth_date": "2011-08-10T00:00:00.000Z", "gender": 1, "createdAt": "2022-06-29T15:00:02.159Z", "updatedAt": "2022-08-10T17:41:20.612Z", "__v": 0 } } ;
    this.sharedProp.current_imaging = { "organization": { "_id": "6220b2610feaeeabbd5b0d84", "short_name": "CUDIM" }, "branch": { "_id": "6267e4200723c74097757338", "short_name": "Clínica Ricaldoni" }, "service": { "_id": "6267e576bb4e2e4f54931fab", "name": "PET-CT" } };
    this.sharedProp.current_modality = { "status": true, "_id": "6267e558bb4e2e4f54931fa7", "code_meaning": "Tomografía por emisión de positrones", "code_value": "PT", "createdAt": "2022-04-26T12:28:08.313Z", "updatedAt": "2022-05-17T23:11:41.203Z", "__v": 0 }
    this.sharedProp.current_procedure = { "_id": "62eabb5b959cca00137d2bf9", "name": "WHB FDG", "equipments": [ { "fk_equipment": "62692da265d8d3c8fb4cdcaa", "duration": 40, "details": { "_id": "62692da265d8d3c8fb4cdcaa", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE 690", "serial_number": "SNGE6902010", "AET": "690", "status": true, "updatedAt": "2022-06-16T19:21:33.535Z" } }, { "fk_equipment": "6269303dcc1a061a4b3252dd", "duration": 20, "details": { "_id": "6269303dcc1a061a4b3252dd", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE STE", "serial_number": "SNGESTE2010", "AET": "STE", "status": true } } ], "informed_consent": true, "preparation": "<p>El paciente debe realizar 12 horas de ayuno.</p><p><strong>El paciente NO puede 24 hs previas al día del estudio:</strong></p><ul><li>Consumir azúcar.</li><li>Consumir bebidas alcohólicas.</li><li>Fumar.</li><li>Realizar ejercicio ni esfuerzos.</li></ul>" } ;
    this.sharedProp.current_slot = '6315f41906f346001301990a';
    this.sharedProp.current_equipment = { "fk_equipment": "62692da265d8d3c8fb4cdcaa", "duration": 40, "details": { "_id": "62692da265d8d3c8fb4cdcaa", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE 690", "serial_number": "SNGE6902010", "AET": "690", "status": true, "updatedAt": "2022-06-16T19:21:33.535Z" } };
    this.sharedProp.current_datetime = { "dateYear": 2022, "dateMonth": "09", "dateDay": "08", "startHours": "09", "startMinutes": 30, "endHours": 10, "endMinutes": 10, "start": "2022-09-08T09:30:00", "end": "2022-09-08T10:10:00" };
    this.sharedProp.current_urgency = false;
    //--------------------------------------------------------------------------------------------------------------------//

    //Set min and max dates (Datepicker):
    const dateRangeLimit = this.sharedFunctions.setDateRangeLimit(new Date(this.sharedProp.current_datetime.start)); //Current date

    this.minDate = dateRangeLimit.minDate;
    this.maxDate = dateRangeLimit.maxDate;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Detalles de la cita',
      content_icon  : 'privacy_tip',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('appointments');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      anamnesis     : [ '', [Validators.required] ],
      indications   : [ '', [Validators.required] ],
      report_before : [ '', [Validators.required] ],
      contact       : [ '', [Validators.required] ],
      status        : [ 'true' ],
    });
  }

  ngOnInit(): void {
  }

  onSubmit(){}

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList('appointments', this.router);
  }
}
