import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
import { ValidateDocumentsService } from '@shared/services/validate-documents.service'; // Validate documents service
import { map, mergeMap } from 'rxjs/operators';                                         // Reactive Extensions (RxJS)
import { ISO_3166, objectKeys } from '@env/environment';                                // Enviroments
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';           // CKEditor
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form-request',
  templateUrl: './form-request.component.html',
  styleUrls: ['./form-request.component.css']
})
export class FormRequestComponent implements OnInit {
  //Set component properties:
  public country_codes                   : any = ISO_3166;
  public documentTypesKeys               : string[] = objectKeys.documentTypesKeys;
  public genderTypesKeys                 : string[] = objectKeys.genderTypesKeys;
  public appointmentRequestsFlowStateKeys: string[] = objectKeys.appointmentRequestsFlowStateKeys;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableModalities    : any;

  //Tab validation error flags (Show error icon on the tab label):
  public mainTabErrors   : boolean = false;
  public studyTabErrors  : boolean = false;
  public patientTabErrors: boolean = false;
  public extraTabErrors  : boolean = false;

  //Initializate validation document vars:
  public registered_doc_type  : boolean = false;
  public validation_result    : boolean = false;
  public disabled_save_button : boolean = false;

  //Initializate response & params objects (Used by onSetDocument's duplicate check pipe):
  private response      : any = {};
  private user_params   : any = {};

  //Create CKEditor component and configure them:
  public ckEditor = customBuildEditor;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public _id            : string = '';
  public form_action    : any;
  private keysWithValues: Array<string> = [];

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Build reactive form fields (Used on first load and to populate data on update):
  private buildFormFields(data: any = {}): any{
    const imaging   = data.imaging   || {};
    const referring = data.referring || {};
    const study     = data.study     || {};
    const patient   = data.patient   || {};
    const extra     = data.extra     || {};

    return {
      //Imaging institution (Organization and Branch are set together, same as the equipments branch input):
      imaging: this.formBuilder.group({
        organization  : [ (imaging.organization && imaging.organization._id) ? imaging.organization._id : (imaging.organization || ''), [Validators.required] ],
        branch        : [ (imaging.branch && imaging.branch._id) ? imaging.branch._id : (imaging.branch || ''), [Validators.required] ]
      }),

      //Referring institution (Organization only):
      referring: this.formBuilder.group({
        organization  : [ (referring.organization && referring.organization._id) ? referring.organization._id : (referring.organization || ''), [Validators.required] ]
      }),

      flow_state  : [ data.flow_state || 'AR01' ],
      urgency     : [ data.urgency !== undefined ? `${data.urgency}` : 'false', [Validators.required] ],
      annotations : [ data.annotations || '' ],
      anamnesis   : [ data.anamnesis || '' ],
      indications : [ data.indications || '' ],

      //Study (Requested modality):
      study: this.formBuilder.group({
        fk_modality : [ study.fk_modality || '', [Validators.required] ]
      }),

      //Patient:
      patient: this.formBuilder.group({
        doc_country_code  : [ patient.doc_country_code || this.sharedProp.mainSettings.appSettings.default_country ],
        doc_type          : [ (patient.doc_type !== undefined && patient.doc_type !== null) ? `${patient.doc_type}` : this.sharedProp.mainSettings.appSettings.default_doc_type, [Validators.required] ],
        document          : [ patient.document || '', [Validators.required] ],
        name_01           : [ patient.name_01 || '', [Validators.required] ],
        name_02           : [ patient.name_02 || '' ],
        surname_01        : [ patient.surname_01 || '', [Validators.required] ],
        surname_02        : [ patient.surname_02 || '' ],
        birth_date        : [ patient.birth_date ? new Date(patient.birth_date.split('T')[0].replace(/-/g, '/')) : '', [Validators.required] ],
        gender            : [ (patient.gender !== undefined && patient.gender !== null) ? `${patient.gender}` : '', [Validators.required] ],
        'phone_numbers[0]': [ (patient.phone_numbers && patient.phone_numbers[0]) || '', [Validators.required] ],
        email             : [ patient.email || '', [Validators.required] ]
      }),

      //Extra data (Physician):
      extra: this.formBuilder.group({
        physician_id      : [ extra.physician_id || '', [Validators.required] ],
        physician_name    : [ extra.physician_name || '', [Validators.required] ],
        physician_contact : [ extra.physician_contact || '', [Validators.required] ]
      })
    };
  }

  //Inject services, components and router to the constructor:
  constructor(
    public formBuilder      : FormBuilder,
    private router          : Router,
    private objRoute        : ActivatedRoute,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    private sharedValidate  : ValidateDocumentsService,
    private i18n            : I18nService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Set action properties:
    sharedProp.actionSetter({
      content_title : this.i18n.instant('APPOINTMENTS.FORM_REQUEST.TITLE'),
      content_icon  : 'move_to_inbox',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('appointment_requests');

    //Set Reactive Form (First time):
    this.setReactiveForm(this.buildFormFields());
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];

    //Find references:
    this.findReferences();

    //Get data from the DB (Only in case that form_action == update):
    if(this.form_action == 'update'){
      //Extract sent data (Parameters by routing):
      this._id = this.objRoute.snapshot.params['_id'];

      //Check if element is not empty:
      if(this._id != ''){
        //Request params:
        const params = { 'filter[_id]': this._id };

        //Find element to update:
        this.sharedFunctions.find(this.sharedProp.element, params, (res) => {
          //Check operation status:
          if(res.success === true){
            //Send data to the form:
            this.setReactiveForm(this.buildFormFields(res.data[0]));

            //Set out-of-edition flow states:
            if(res.data[0].flow_state == 'AR05' || res.data[0].flow_state == 'AR06'){
              this.form.controls['flow_state'].disable();
            }

            //Get property keys with values:
            this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

            //Validate document (Set validation icon state for the loaded patient):
            this.validateDocument();

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage(this.i18n.instant('APPOINTMENTS.FORM_REQUEST.EDIT_ERROR') + res.message);
            this.router.navigate(['/appointments/list_requests']);
          }
        });
      }
    }

    //Preload the "Physician" tab with the logged user's own data (self-service insert by role Médico):
    if(this.form_action == 'insert' && this.sharedProp.userLogged.permissions[0].role == 4){
      this.prefillPhysicianData();
    }

    //Enable source editing CKEditor for Superuser:
    if(this.sharedProp.userLogged.permissions[0].role == 1){
      //Add sourceEditing to the toolbar:
      if(!this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.includes('sourceEditing')){ this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.push('sourceEditing'); }
    }
  }

  //Preload requesting physician fields with the logged in Médico's own person and professional data:
  prefillPhysicianData(): void{
    const person_params = { 'filter[_id]': this.sharedProp.userLogged.person_id };

    //Person data (Name and contact phone):
    this.sharedFunctions.find('people', person_params, (res) => {
      if(res.success === true && res.data.length > 0){
        const person = res.data[0];

        this.form.get('extra.physician_name')?.setValue(`${person.name_01} ${person.surname_01}`.trim());

        if(person.phone_numbers && person.phone_numbers.length > 0){
          this.form.get('extra.physician_contact')?.setValue(person.phone_numbers[0]);
        }
      }
    });

    const user_params = { 'filter[_id]': this.sharedProp.userLogged.user_id };

    //User's professional data (physician_id maps to users.professional.id, not the person's document):
    this.sharedFunctions.find('users', user_params, (res) => {
      if(res.success === true && res.data.length > 0 && res.data[0].professional && res.data[0].professional.id){
        this.form.get('extra.physician_id')?.setValue(res.data[0].professional.id);
      }
    });
  }

  //Validate patient document (Reuses the same document validation used across the app, e.g. patient check-in):
  validateDocument(){
    //Get validation result:
    const result = this.sharedValidate.validate(this.form.value.patient.doc_country_code, this.form.value.patient.doc_type, this.form.value.patient.document);

    //Set validation result in component vars:
    this.registered_doc_type = result.registered_doc_type;

    //Check that the type of document is registered:
    if(result.registered_doc_type === true){
      this.validation_result = result.validation_result;

      //Check if the document requires parsing:
      if(result.doc_parser.is_parsed === true){
        this.form.get('patient.document')?.setValue(result.doc_parser.parser_result);
      }

      //Enable and disable save button:
      this.disabled_save_button = !result.validation_result;
    } else {
      //Enable save button (Document type not registered):
      this.disabled_save_button = false;
    }
  }

  //Check if the entered document already belongs to a registered person/patient (Same duplicate-check pattern as users/form and appointments/set-patient):
  onSetDocument(preventClear: boolean = false): void{
    //Validate document (Check registered_doc_type):
    this.validateDocument();

    //Check document fields content:
    if(this.form.value.patient.document != '' && this.form.value.patient.doc_country_code != '' && this.form.value.patient.doc_type != ''){

      //Set people params:
      const people_params = {
        'filter[elemMatch][documents][document]' : this.form.value.patient.document.toUpperCase(),
        'filter[elemMatch][documents][doc_country_code]' : this.form.value.patient.doc_country_code,
        'filter[elemMatch][documents][doc_type]' : this.form.value.patient.doc_type
      };

      //Create observable people:
      const obsPeople = this.sharedFunctions.findRxJS('people', people_params, true);

      //Create observable obsUser:
      const obsUser = obsPeople.pipe(
        //Check first result (find person):
        map((res: any) => {
          //Clear response and user_params objects:
          this.response = {};
          this.user_params = {};

          //Check operation status:
          if(res.success === true){
            //Check data:
            if(Object.keys(res.data).length > 0){
              //Set user params:
              this.user_params = {
                'filter[fk_person]' : res.data[0]._id,
                'proj[password]'    : 0
              };

              //Preserve response (only person data case):
              this.response = res;
            }
          }

          //Return response:
          return res;
        }),

        //Search user with the fk_person (Return observable):
        mergeMap(() => this.sharedFunctions.findRxJS('users', this.user_params, true)),

        //Check second result (find user):
        map((res: any) => {
          //Check operation status:
          if(res.success === true){
            //Check data:
            if(Object.keys(res.data).length == 0 || Object.keys(this.user_params).length == 0){
              //Preserve person response (only person data case):
              res = this.response;
            } else {
              //Preserve user response (in case you need to control from onSetEmail):
              this.response = res;
            }
          }

          //Return response:
          return res;
        })
      );

      //Observe content (Subscribe):
      obsUser.subscribe({
        next: (res) => {
          //Check response:
          if(Object.keys(res).length > 0){
            //Clear previous patient data before loading the found one:
            this.clearPatientFields(true);

            //Found person WITH an associated user account:
            if(res.data[0].fk_person){
              this.setPatientFromPerson(res.data[0].person);

              if(res.data[0].email){ this.form.get('patient.email')?.setValue(res.data[0].email); }

            //Found person WITHOUT an associated user account (Only person data available):
            } else {
              this.setPatientFromPerson(res.data[0]);
            }

          //Genuinely new patient (No person/user found):
          } else {
            this.clearPatientFields(true);
          }
        }
      });
    } else {
      //Check prevent clear (selectionChange: doc_country_code and doc_type):
      if(preventClear == false){
        //Clear data to FormControl elements:
        this.clearPatientFields();
      }
    }
  }

  //Check if the entered email already belongs to a registered person/patient (Same duplicate-check pattern as users/form and appointments/set-patient):
  onSetEmail(): void{
    //Check the email field is not empty:
    if(this.form.value.patient.email != ''){
      //Set user params:
      const user_params = {
        'filter[email]'   : this.form.value.patient.email,
        'proj[password]'  : 0
      };

      //Create observable users:
      const obsUsers = this.sharedFunctions.findRxJS('users', user_params, true);

      //Observe content (Subscribe):
      obsUsers.subscribe({
        next: (res) => {
          //Check current response and res data (user data):
          if(res.success === true && res.data.length > 0){
            //Get native element to set focus:
            const inputEmail = document.getElementById('IDtxtEmail');

            //Check if document field is empty:
            if(this.form.value.patient.document != ''){

              //Check that the user is human (has an associated person record):
              if(res.data[0].person){
                //Create operation handler:
                const operationHandler = {
                  user_data : res.data[0]
                };

                //Open dialog to decide what operation to perform:
                this.sharedFunctions.openDialog('found_person', operationHandler, (result) => {
                  //Check if result is true:
                  if(result){
                    //Clear data to FormControl elements:
                    this.clearPatientFields();

                    //Send data to FormControl elements:
                    this.setPatientFromPerson(res.data[0].person);
                    this.form.get('patient.email')?.setValue(res.data[0].email);

                  } else {
                    //Clear email input and focus on this:
                    this.form.get('patient.email')?.setValue('');
                    inputEmail?.focus();
                  }
                });
              } else {
                //Send message, clear email input and focus on this (Reuse the existing set-patient message):
                this.sharedFunctions.sendMessage(this.i18n.instant('APPOINTMENTS.SET_PATIENT.MACHINE_USER_EMAIL_ERROR'));
                this.form.get('patient.email')?.setValue('');
                inputEmail?.focus();
              }

            //Empty document case (No conflicting data to overwrite):
            } else {
              //Clear data to FormControl elements:
              this.clearPatientFields();

              //Send data to FormControl elements:
              this.setPatientFromPerson(res.data[0].person);
              this.form.get('patient.email')?.setValue(res.data[0].email);
            }
          }
        }
      });
    }
  }

  //Send person data to the flat 'patient' FormGroup (Same field mapping as UsersService.setPerson):
  private setPatientFromPerson(personData: any): void{
    this.form.get('patient.doc_country_code')?.setValue(personData.documents[0].doc_country_code);
    this.form.get('patient.doc_type')?.setValue(personData.documents[0].doc_type.toString());
    this.form.get('patient.document')?.setValue(personData.documents[0].document);
    this.form.get('patient.name_01')?.setValue(personData.name_01);
    this.form.get('patient.name_02')?.setValue(personData.name_02);
    this.form.get('patient.surname_01')?.setValue(personData.surname_01);
    this.form.get('patient.surname_02')?.setValue(personData.surname_02);
    this.form.get('patient.gender')?.setValue(personData.gender.toString());
    this.form.get('patient.phone_numbers[0]')?.setValue(personData.phone_numbers[0]);
    this.form.get('patient.birth_date')?.setValue(new Date(personData.birth_date.split('T')[0].replace(/-/g, '/'))); //Replace '-' by '/' to prevent one day off JS Date error.
  }

  //Clear patient FormControl elements (preventClear preserves document/doc_country_code/doc_type):
  private clearPatientFields(preventClear: boolean = false): void{
    if(preventClear == false){
      this.form.get('patient.document')?.setValue('');
      this.form.get('patient.doc_country_code')?.setValue(this.sharedProp.mainSettings.appSettings.default_country);
      this.form.get('patient.doc_type')?.setValue(this.sharedProp.mainSettings.appSettings.default_doc_type.toString());
    }
    this.form.get('patient.name_01')?.setValue('');
    this.form.get('patient.name_02')?.setValue('');
    this.form.get('patient.surname_01')?.setValue('');
    this.form.get('patient.surname_02')?.setValue('');
    this.form.get('patient.gender')?.setValue('');
    this.form.get('patient.phone_numbers[0]')?.setValue('');
    this.form.get('patient.birth_date')?.setValue('');
    this.form.get('patient.email')?.setValue('');
  }

  //Set imaging organization from the selected branch (Same behaviour as the equipments branch input):
  onImagingBranchChange(branch_id: string): void{
    const currentBranch = (this.availableBranches || []).find((current: any) => current._id === branch_id);

    if(currentBranch){
      this.form.get('imaging.organization')?.setValue(currentBranch.fk_organization);
    }
  }

  onSubmit(){
    //Required validator doesn't effect the input fields, if you don't mark them as dirty, when they are in pristine state:
    this.form.markAllAsTouched();

    //Check main tab errors:
    this.mainTabErrors = !(
      this.form.controls['imaging'].valid &&
      this.form.controls['referring'].valid &&
      this.form.controls['flow_state'].valid &&
      this.form.controls['urgency'].valid &&
      this.form.controls['annotations'].valid &&
      this.form.controls['anamnesis'].valid &&
      this.form.controls['indications'].valid
    );

    //Check study tab errors:
    this.studyTabErrors = this.form.controls['study'].invalid;

    //Check patient tab errors:
    this.patientTabErrors = this.form.controls['patient'].invalid;

    //Check extra tab errors:
    this.extraTabErrors = this.form.controls['extra'].invalid;

    //Validate fields:
    if(this.form.valid){
      //Clone form values to avoid mutating the reactive form model:
      const saveData = JSON.parse(JSON.stringify(this.form.value));

      //Data normalization - Booleans types (mat-radio-group cases):
      if(typeof saveData.urgency != "boolean"){ saveData.urgency = saveData.urgency.toLowerCase() == 'true' ? true : false; }

      //Data normalization - Birth date:
      saveData.patient.birth_date = this.sharedFunctions.setDatetimeFormat(this.form.value.patient.birth_date);

      //Data normalization - Phone numbers to array:
      saveData.patient['phone_numbers'] = [];
      if(saveData.patient['phone_numbers[0]'] != ''){ saveData.patient['phone_numbers'].push(saveData.patient['phone_numbers[0]']); }
      delete saveData.patient['phone_numbers[0]'];

      //Data normalization - Remove empty optional nested fields (Prevent validator errors on empty strings):
      ['doc_country_code', 'name_02', 'surname_02', 'email'].forEach((key) => {
        if(saveData.patient[key] == ''){ delete saveData.patient[key]; }
      });

      ['physician_id', 'physician_name', 'physician_contact'].forEach((key) => {
        if(saveData.extra[key] == ''){ delete saveData.extra[key]; }
      });

      if(saveData.imaging.branch == ''){ delete saveData.imaging.branch; }

      //Save data:
      this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, saveData, this.keysWithValues, (res) => {
        //Response the form according to the result:
        this.sharedFunctions.formResponder(res, '/appointments/list_requests', this.router, false);
      });
    }
  }

  onCancel(){
    //Redirect to the list:
    this.router.navigate(['/appointments/list_requests']);
  }

  findReferences(){
    //Initialize params:
    let params: any;

    //Switch params:
    switch(this.form_action){
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

    //Find modalities:
    this.sharedFunctions.find('modalities', params, (res) => {
      this.availableModalities = res.data;
    });
  }
}
