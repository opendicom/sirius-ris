import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';                     // API Client Service
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  app_setting,
  ISO_3166,
  document_types,
  gender_types,
  inpatient_types,
  CKEditorConfig
} from '@env/environment';
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';               // CKEditor
import { Country, State, City }  from 'country-state-city';                                 // Country State City
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form-insert',
  templateUrl: './form-insert.component.html',
  styleUrls: ['./form-insert.component.css']
})
export class FormInsertComponent implements OnInit {
  //Set component properties:
  public settings         : any = app_setting;
  public country_codes    : any = ISO_3166;
  public document_types   : any = document_types;
  public gender_types     : any = gender_types;
  public inpatient_types  : any = inpatient_types;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Get Country State City information (Default settings):
  public allCountries   : any = Country.getAllCountries();
  public currentStates  : any = State.getStatesOfCountry(this.settings.default_country_isoCode);
  public currentCities  : any = City.getCitiesOfState(this.settings.default_country_isoCode, this.settings.default_state_isoCode);

  //Create CKEditor component and configure them:
  public customEditor = customBuildEditor;
  public editorConfig = CKEditorConfig;

  //Create CKEditor validator:
  public anamnesisValidator = true;
  public indicationsValidator = true;

  //Min and max dates:
  public minDate: Date;
  public maxDate: Date;

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableServices      : any;

  //Set referring and reporting objects:
  public referringOrganizations   : any;
  public reportingUsers           : any;

  //Initialize selected file objects:
  public fileUploadProgress     : Number = 0;
  public fileManagerController  : any = {
    informed_consent  : {
      files: {},
      disabled: false
    },
    clinical_trial    : {
      files: {},
      disabled: false
    },
    attached_files    : {
      files: {},
      disabled: false
    }
  };

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services, components and router to the constructor:
  constructor(
    private apiClient       : ApiClientService,
    private router          : Router,
    private objRoute        : ActivatedRoute,
    public formBuilder      : FormBuilder,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions : SharedFunctionsService
  ) {
    //--------------------------------------------------------------------------------------------------------------------//
    // TEST DATA:
    //--------------------------------------------------------------------------------------------------------------------//
    /*
    this.sharedProp.current_patient = { "_id": "62bef5cc67d1c30013f612f4", "status": true, "fk_person": "62bc68f266d77500136f5a32", "email": "milhouse.vanhouten@gmail.com", "permissions": [ { "concession": [], "organization": "6220b26e0feaeeabbd5b0d93", "role": 2 } ], "settings": [], "createdAt": "2022-07-01T13:25:32.539Z", "updatedAt": "2022-08-10T17:41:20.655Z", "__v": 0, "person": { "_id": "62bc68f266d77500136f5a32", "phone_numbers": [ "099654283", "24819374" ], "documents": [ { "doc_country_code": "858", "doc_type": 1, "document": "12345672" } ], "name_01": "MILHOUSE", "surname_01": "VAN HOUTEN", "birth_date": "2011-08-10T00:00:00.000Z", "gender": 1, "createdAt": "2022-06-29T15:00:02.159Z", "updatedAt": "2022-08-10T17:41:20.612Z", "__v": 0 } } ;
    this.sharedProp.current_imaging = { "organization": { "_id": "6220b2610feaeeabbd5b0d84", "short_name": "CUDIM" }, "branch": { "_id": "6267e4200723c74097757338", "short_name": "Clínica Ricaldoni" }, "service": { "_id": "6267e576bb4e2e4f54931fab", "name": "PET-CT" } };
    this.sharedProp.current_modality = { "status": true, "_id": "6267e558bb4e2e4f54931fa7", "code_meaning": "Tomografía por emisión de positrones", "code_value": "PT", "createdAt": "2022-04-26T12:28:08.313Z", "updatedAt": "2022-05-17T23:11:41.203Z", "__v": 0 }
    this.sharedProp.current_procedure = { "_id": "62eabb5b959cca00137d2bf9", "name": "WHB FDG", "equipments": [ { "fk_equipment": "62692da265d8d3c8fb4cdcaa", "duration": 40, "details": { "_id": "62692da265d8d3c8fb4cdcaa", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE 690", "serial_number": "SNGE6902010", "AET": "690", "status": true, "updatedAt": "2022-06-16T19:21:33.535Z" } }, { "fk_equipment": "6269303dcc1a061a4b3252dd", "duration": 20, "details": { "_id": "6269303dcc1a061a4b3252dd", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE STE", "serial_number": "SNGESTE2010", "AET": "STE", "status": true } } ], "informed_consent": true, "preparation": "<p>El paciente debe realizar 12 horas de ayuno.</p><p><strong>El paciente NO puede 24 hs previas al día del estudio:</strong></p><ul><li>Consumir azúcar.</li><li>Consumir bebidas alcohólicas.</li><li>Fumar.</li><li>Realizar ejercicio ni esfuerzos.</li></ul>" } ;
    this.sharedProp.current_slot = '6315f41906f346001301990a';
    this.sharedProp.current_equipment = { "fk_equipment": "62692da265d8d3c8fb4cdcaa", "duration": 40, "details": { "_id": "62692da265d8d3c8fb4cdcaa", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE 690", "serial_number": "SNGE6902010", "AET": "690", "status": true, "updatedAt": "2022-06-16T19:21:33.535Z" } };
    this.sharedProp.current_datetime = { "dateYear": 2022, "dateMonth": "09", "dateDay": "08", "startHours": "09", "startMinutes": 30, "endHours": 10, "endMinutes": 10, "start": "2022-09-08T09:30:00", "end": "2022-09-08T10:10:00" };
    this.sharedProp.current_urgency = false;
    */
    //--------------------------------------------------------------------------------------------------------------------//

    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Set min and max dates (Datepicker):
    const dateRangeLimit = this.sharedFunctions.setDateRangeLimit(new Date(this.sharedProp.current_datetime.start)); //Current date

    this.minDate = dateRangeLimit.minDate;
    this.maxDate = dateRangeLimit.maxDate;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Paso 04 - Detalles de la cita',
      content_icon  : 'privacy_tip',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('appointments');

    //Set sugested reporting:
    const sugestedReporting = this.sharedProp.current_imaging.organization._id + '.' + this.sharedProp.current_imaging.branch._id + '.' + this.sharedProp.current_imaging.service._id;

    //Set contrast values (PET-CT cases):
    let use_contrast = false;
    let contrast_description = '';
    if(this.sharedProp.current_modality.code_value == 'PT'){
      use_contrast = true;
      contrast_description = this.sharedProp.current_procedure.name;
    }

    //Set Reactive Form (First time):
    this.setReactiveForm({
      referring_organization    : [ this.sharedProp.current_imaging.organization._id, [Validators.required] ],
      reporting_domain          : [ sugestedReporting, [Validators.required] ],
      reporting_user            : [ '', [Validators.required] ],

      anamnesis                 : [ '', [Validators.required] ],
      indications               : [ '', [Validators.required] ],
      report_before             : [ '', [Validators.required] ],
      contact                   : [ '', [Validators.required] ],
      status                    : [ 'true', [Validators.required] ],

      //Current address fields:
      current_address: this.formBuilder.group({
        country                 : [ this.settings.default_country_name, [Validators.required] ],
        state                   : [ this.settings.default_state_name, [Validators.required] ],
        city                    : [ this.settings.default_city_name, [Validators.required] ],
        neighborhood            : [ '', [Validators.required] ],
        address                 : [ '', [Validators.required] ],
      }),

      //Contrast fields:
      contrast: this.formBuilder.group({
        use_contrast            : [ use_contrast, [Validators.required] ],
        description             : [ contrast_description ],
      }),

      //Private health fields:
      private_health: this.formBuilder.group({
        height                  : [ '', [Validators.required]],
        weight                  : [ '', [Validators.required]],
        diabetes                : [ false, [Validators.required] ],
        hypertension            : [ false, [Validators.required] ],
        epoc                    : [ false, [Validators.required] ],
        smoking                 : [ false, [Validators.required] ],
        malnutrition            : [ false, [Validators.required] ],
        obesity                 : [ false, [Validators.required] ],
        hiv                     : [ false, [Validators.required] ],
        renal_insufficiency     : [ false, [Validators.required] ],
        heart_failure           : [ false, [Validators.required] ],
        ischemic_heart_disease  : [ false, [Validators.required] ],
        valvulopathy            : [ false, [Validators.required] ],
        arrhythmia              : [ false, [Validators.required] ],
        cancer                  : [ false, [Validators.required] ],
        dementia                : [ false, [Validators.required] ],
        claustrophobia          : [ false, [Validators.required] ],
        asthma                  : [ false, [Validators.required] ],
        hyperthyroidism         : [ false, [Validators.required] ],
        hypothyroidism          : [ false, [Validators.required] ],
        pregnancy               : [ false, [Validators.required] ],
        other                   : [ '' ],
        medication              : [ '' ],
        allergies               : [ '' ],

        implants: this.formBuilder.group({
          cochlear_implant      : [ false, [Validators.required] ],
          cardiac_stent         : [ false, [Validators.required] ],
          metal_prostheses      : [ false, [Validators.required] ],
          metal_shards          : [ false, [Validators.required] ],
          pacemaker             : [ false, [Validators.required] ],
          other                 : [ '' ]
        }),

        covid19: this.formBuilder.group({
          had_covid             : [ false, [Validators.required] ],
          vaccinated            : [ false, [Validators.required] ],
          details               : [ '' ]
        }),
      }),

      outpatient                : [ 'true', [Validators.required] ],
      inpatient: this.formBuilder.group({
        type                    : [ '' ],
        where                   : [ '' ],
        room                    : [ '' ],
        contact                 : [ '' ]
      })
    });
  }

  ngOnInit(): void {
    //Find references:
    this.findReferences();

    //Find referring organizations:
    this.findReferringOrganizations();

    //Find referring and reporting information:
    this.findReportingUsers(this.sharedProp.current_imaging.service._id);
  }

  setCurrentStates(country_isoCode: string){
    //Set current states:
    this.currentStates = State.getStatesOfCountry(country_isoCode);

    //Disable category input:
    this.form.get('current_address.city')?.disable();
  }

  setCurrentCities(country_isoCode: string, state_isoCode: string){
    //Set current cities:
    this.currentCities = City.getCitiesOfState(country_isoCode, state_isoCode);

    //Disable category input:
    this.form.get('current_address.city')?.enable();
  }

  onChangeContrast(event: any){
    //Get div contrast_description from DOM:
    const $contrast_description = document.getElementById('contrast_description');

    if(event.value == 'true'){
      //Display input:
      $contrast_description?.classList.remove('non-display');
    } else {
      //Clear input:
      this.form.get('contrast.description')?.setValue('');

      //Hide input:
      $contrast_description?.classList.add('non-display');
    }
  }

  onCheckOtherPatology(event: any){
    //Get div contrast_description from DOM:
    const $private_health_other = document.getElementById('private_health_other');

    if(event.checked == true){
      //Display input:
      $private_health_other?.classList.remove('non-display');
    } else {
      //Clear input:
      this.form.get('private_health.other')?.setValue('');

      //Hide input:
      $private_health_other?.classList.add('non-display');
    }
  }

  onCheckOtherImplants(event: any){
    //Get div contrast_description from DOM:
    const $implants_other = document.getElementById('implants_other');

    if(event.checked == true){
      //Display input:
      $implants_other?.classList.remove('non-display');
    } else {
      //Clear input:
      this.form.get('implants.other')?.setValue('');

      //Hide input:
      $implants_other?.classList.add('non-display');
    }
  }

  async onChangeOutpatient(event: any){
    //Get element from DOM:
    const $elementDOM = document.getElementById('inpatient');

    if(event.value == 'false'){
      //Display element:
      $elementDOM?.classList.remove('non-display');
    } else {
      //Set clear inputs:
      const clear_inputs = ['inpatient.type', 'inpatient.where', 'inpatient.room', 'inpatient.contact'];

      //Clear inputs:
      await (await Promise.all(Object.keys(clear_inputs))).map((key) => {
        this.form.get(clear_inputs[parseInt(key)])?.setValue('');
      });

      //Hide element:
      $elementDOM?.classList.add('non-display');
    }
  }

  onFileSelected(event: any, type: string){
    //Upload selected file (RxJS):
    this.apiClient.sendFileRequest(
        'files/insert',
        <File>event.target.files[0],
        this.sharedProp.current_imaging.organization._id,
        this.sharedProp.current_imaging.branch._id,
        type
      ).subscribe({
      next: (res) => {
        //Check operation status:
        switch(res.operation_status){
          case 'uploading':
            //Disable upload button:
            this.fileManagerController[type].disabled = true;

            //Set upload progress:
            this.fileUploadProgress = res.progress, 10;

            break;

          case 'finished':
            //Check operation status (backend server response):
            if(res.server_response.body.success === true){

              //Add current atached file in atachedFiles object:
              this.fileManagerController[type].files[res.server_response.body.data._id] = res.server_response.body.data.name;

              //Send snakbar message:
              this.sharedFunctions.sendMessage('Archivo subido exitosamente');
            } else {
              //Send snakbar message:
              this.sharedFunctions.sendMessage(res.error.message);
            }

            //Enable upload button:
            this.fileManagerController[type].disabled = false;

            break;

          case 'cancelled':
            //Send snakbar message:
            this.sharedFunctions.sendMessage(res.message);

            break;
        }
      },
      error: res => {
        //Send snakbar message:
        if(res.error.message){
          this.sharedFunctions.sendMessage(res.error.message);
        } else {
          this.sharedFunctions.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
        }
      }
    });
  }

  onDeleteFile(_id: any, type: string){
    //Create operation handler:
    const operationHandler = {
      element         : 'files',
      selected_items  : [_id],
      excludeRedirect : true
    }

    //Open dialog to confirm:
    this.sharedFunctions.openDialog('delete', operationHandler, (result) => {
      //Check result:
      if(result === true){
        //Remove deleted file from atachedFiles object:
        delete this.fileManagerController[type].files[_id];
      }
    });
  }

  onSubmit(){
    //Set study IUID:
    /* This method belongs to the backend:
    this.sharedFunctions.setStudyIUID(this.sharedProp.current_imaging.branch._id, '2', (res, study_iuid) => {
      //Check result:
      if(res.success){
        console.log(study_iuid);
      } else {
        //Send snakbar message:
        this.sharedFunctions.sendMessage(res.message);
      }
    });
    */

    //Validate CKEditor anamnesis (min length 10 + 7 chars [<p></p>]):
    if(this.form.value.anamnesis.length < 17){
      this.anamnesisValidator = false;
    } else {
      this.anamnesisValidator = true;
    }

    //Validate CKEditor indications (min length 10 + 7 chars [<p></p>]):
    if(this.form.value.indications.length < 17){
      this.indicationsValidator = false;
    } else {
      this.indicationsValidator = true;
    }

    //Validate fields:
    if(this.form.valid){
      //Create save object (Set sharedProp current data):
      let appointmentSaveData: any = {
        imaging: {
          organization  : this.sharedProp.current_imaging.organization._id,
          branch        : this.sharedProp.current_imaging.branch._id,
          service       : this.sharedProp.current_imaging.service._id
        },
        fk_patient    : this.sharedProp.current_patient._id,
        start         : this.sharedProp.current_datetime.start + '.000Z',
        end           : this.sharedProp.current_datetime.end + '.000Z',
        flow_state    : 'A01',
        fk_slot       : this.sharedProp.current_slot,
        fk_procedure  : this.sharedProp.current_procedure._id,
        urgency       : this.sharedProp.current_urgency
      };

      //Add uploaded files:
      if(Object.keys(this.fileManagerController.informed_consent.files).length > 0){
        //Prevent: Cannot set properties of undefined:
        if(!appointmentSaveData.consents){ appointmentSaveData['consents'] = {}; }
        appointmentSaveData.consents['informed_consent'] = Object.keys(this.fileManagerController.informed_consent.files)[0];
      }

      if(Object.keys(this.fileManagerController.clinical_trial.files).length > 0){
        //Prevent: Cannot set properties of undefined:
        if(!appointmentSaveData.consents){ appointmentSaveData['consents'] = {}; }
        appointmentSaveData.consents['clinical_trial'] = Object.keys(this.fileManagerController.clinical_trial.files)[0];
      }

      if(Object.keys(this.fileManagerController.attached_files.files).length > 0){
        appointmentSaveData['attached_files'] = Object.keys(this.fileManagerController.attached_files.files);
      }

      //Merge Form Values in Appointments save data:
      let mergedValues = {
        ...appointmentSaveData,
        ...this.form.value
      };

      //Data normalization - Referring:
      mergedValues['referring'] = { organization: mergedValues.referring_organization };

      //Data normalization - Reporting:
      const reportingSplitted = mergedValues.reporting_domain.split('.');
      mergedValues['reporting'] = {
        organization  : reportingSplitted[0],
        branch        : reportingSplitted[1],
        service       : reportingSplitted[2]
      };

      //Data normalizarion - FK Reporting:
      mergedValues.reporting['fk_reporting'] = [mergedValues.reporting_user];

      //Data normalization - Dates types:
      mergedValues.report_before = this.sharedFunctions.setDatetimeFormat(mergedValues.report_before);

      //Data normalization - Booleans types (mat-option cases):
      if(typeof mergedValues.outpatient != "boolean"){ mergedValues.outpatient = mergedValues.outpatient.toLowerCase() == 'true' ? true : false; }
      if(typeof mergedValues.contrast.use_contrast != "boolean"){ mergedValues.contrast.use_contrast = mergedValues.contrast.use_contrast.toLowerCase() == 'true' ? true : false; }
      if(typeof mergedValues.status != "boolean"){ mergedValues.status = mergedValues.status.toLowerCase() == 'true' ? true : false; }

      //Clean empty fields | Nested object cases - Check outpatient:
      if(mergedValues.outpatient === true){
        delete mergedValues.inpatient;
      }

      //Clean empty fields | Nested object cases - private_health.medication:
      if(mergedValues.private_health.medication !== undefined){
        if(mergedValues.private_health.medication.length == 0){
          delete mergedValues.private_health.medication;
        }
      }

      //Clean empty fields | Nested object cases - private_health.allergies:
      if(mergedValues.private_health.allergies !== undefined){
        if(mergedValues.private_health.allergies.length == 0){
          delete mergedValues.private_health.allergies;
        }
      }

      //Clean empty fields | Nested object cases - private_health.other:
      if(mergedValues.private_health.other !== undefined){
        if(mergedValues.private_health.other.length == 0){
          delete mergedValues.private_health.other;
        }
      }

      //Clean empty fields | Nested object cases - private_health.implants.other:
      if(mergedValues.private_health.implants.other !== undefined){
        if(mergedValues.private_health.implants.other.length == 0){
          delete mergedValues.private_health.implants.other;
        }
      }

      //Clean empty fields | Nested object cases - private_health.covid19.details:
      if(mergedValues.private_health.covid19.details !== undefined){
        if(mergedValues.private_health.covid19.details.length == 0){
          delete mergedValues.private_health.covid19.details;
        }
      }

      //Delete temp values:
      delete mergedValues.referring_organization;
      delete mergedValues.reporting_domain;
      delete mergedValues.reporting_user;

      //Save data:
      this.sharedFunctions.save('insert', this.sharedProp.element, '', mergedValues, [], (res) => {
        //Response the form according to the result:
        this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
      });
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList('appointments', this.router);
  }

  findReferringOrganizations(){
    //Set params:
    const params = {
      'rabc_exclude_code' : this.settings.rabc_exclude_code,
      'filter[status]'    : true
    };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.referringOrganizations = res.data;
    });
  }

  findReportingUsers(service_id: string){
    //Set params:
    const params = {
      //Only people users:
      'filter[person.name_01]': '',
      'regex': true,

      //Only Doctors users in selected service:
      'filter[elemMatch][permissions][service]': service_id,
      'filter[elemMatch][permissions][role]': 4,

      //Exclude users with vacation true:
      'filter[professional.vacation]': false,

      //Only enabled users:
      'filter[status]': true
    };

    //Find reporting users:
    this.sharedFunctions.find('users', params, (res) => {
      //Check data:
      if(res.data.length > 0){
        //Set reporting users:
        this.reportingUsers = res.data;
      } else {
        //Clear previous values:
        this.reportingUsers = [];
        this.form.controls['reporting_user'].setValue('');

        //Send message:
        this.sharedFunctions.sendMessage('Advertencia: El servicio seleccionado NO tiene asignado ningún médico informador.');
      }
    });
  }

  findReferences(){
    //Initialize params:
    let params: any;

    //Switch params:
    switch(this.objRoute.snapshot.params['action']){
      case 'insert':
        params = { 'filter[status]': true };
        break;

      case 'update':
        params = {};
        break;
    }

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.availableOrganizations = res.data;
    });

     //Find branches:
     this.sharedFunctions.find('branches', params, (res) => {
      this.availableBranches = res.data;
    });

    //Find services:
    this.sharedFunctions.find('services', params, (res) => {
      this.availableServices = res.data;
    });
  }
}
