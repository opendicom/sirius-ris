import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                                   // Router
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { AppointmentsService } from '@modules/appointments/services/appointments.service';  // Appointments service
import { FileManagerService } from '@shared/services/file-manager.service';                 // File manager service
import {                                                                                    // Enviroments
  app_setting,
  ISO_3166,
  document_types,
  gender_types,
  inpatient_types,
  privateHealthLang,
  CKEditorConfig
} from '@env/environment';
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';               // CKEditor
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form-insert',
  templateUrl: './form-insert.component.html',
  styleUrls: ['./form-insert.component.css']
})
export class FormInsertComponent implements OnInit {
  //Set component properties:
  public settings           : any = app_setting;
  public country_codes      : any = ISO_3166;
  public document_types     : any = document_types;
  public gender_types       : any = gender_types;
  public inpatient_types    : any = inpatient_types;
  public privateHealthLang  : any = privateHealthLang;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Create CKEditor component and configure them:
  public customEditor = customBuildEditor;
  public editorConfig = CKEditorConfig;

  //Create CKEditor validator:
  public anamnesisValidator = true;
  public indicationsValidator = true;

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
    private router              : Router,
    public formBuilder          : FormBuilder,
    public sharedProp           : SharedPropertiesService,
    public sharedFunctions      : SharedFunctionsService,
    public appointmentsService  : AppointmentsService,
    public fileManager          : FileManagerService
  ) {
    //Initialize selected file objects:
    this.fileManager.uploadProgress = 0;
    this.fileManager.controller = {
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

      anamnesis                 : [ '' ],
      indications               : [ '' ],
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
    this.appointmentsService.findReferences({ 'filter[status]': true });

    //Find referring organizations:
    this.appointmentsService.findReferringOrganizations();

    //Find referring and reporting information:
    this.appointmentsService.findReportingUsers(this.sharedProp.current_imaging.service._id, this.form);
  }

  onSubmit(){
    // DISABLED | Validate CKEditor anamnesis (min length 10 + 7 chars [<p></p>]):
    // if(this.form.value.anamnesis.length < 17){
    //   this.anamnesisValidator = false;
    // } else {
    //   this.anamnesisValidator = true;
    // }

    // DISABLED | Validate CKEditor indications (min length 10 + 7 chars [<p></p>]):
    // if(this.form.value.indications.length < 17){
    //   this.indicationsValidator = false;
    // } else {
    //   this.indicationsValidator = true;
    // }

    //Validate fields:
    if(this.form.valid){
      this.appointmentsService.saveAppointment('insert', this.form, this.fileManager);
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }
}
