import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
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

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage(this.i18n.instant('APPOINTMENTS.FORM_REQUEST.EDIT_ERROR') + res.message);
            this.router.navigate(['/appointments/list_requests']);
          }
        });
      }
    }

    //Enable source editing CKEditor for Superuser:
    if(this.sharedProp.userLogged.permissions[0].role == 1){
      //Add sourceEditing to the toolbar:
      if(!this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.includes('sourceEditing')){ this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.push('sourceEditing'); }
    }
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
