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
  inpatient_types,
  appointments_flow_states,
  cancellation_reasons,
  CKEditorConfig
} from '@env/environment';
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';               // CKEditor
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-tab-details',
  templateUrl: './tab-details.component.html',
  styleUrls: ['./tab-details.component.css']
})
export class TabDetailsComponent implements OnInit {
  //Set component properties:
  public settings             : any = app_setting;
  public inpatient_types      : any = inpatient_types;
  public appointmentsFS       : any = appointments_flow_states;
  public cancellation_reasons : any = cancellation_reasons;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Boolean class binding objects:
  public booleanCancelation : Boolean = false;

  //Create CKEditor component and configure them:
  public customEditor = customBuildEditor;
  public editorConfig = CKEditorConfig;

  //Create CKEditor validator:
  public anamnesisValidator = true;
  public indicationsValidator = true;

  //Min and max dates:
  public minDate: Date = new Date();
  public maxDate: Date = new Date();

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

  ){
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
  }

  ngOnInit(): void {
    //Set Reactive Form (First time):
    this.setReactiveForm({
      referring_organization    : [ '', [Validators.required] ],
      reporting_domain          : [ '', [Validators.required] ],
      reporting_user            : [ '', [Validators.required] ],

      anamnesis                 : [ '', [Validators.required] ],
      indications               : [ '', [Validators.required] ],
      report_before             : [ '', [Validators.required] ],
      contact                   : [ '', [Validators.required] ],
      status                    : [ 'true', [Validators.required] ],
      flow_state                : [ 'A01', [Validators.required] ],
      cancellation_reasons      : [ '' ],

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
        use_contrast            : [ false, [Validators.required] ],
        description             : [ '' ],
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
        otherBoolean            : [ 'false', [Validators.required] ],
        medication              : [ '' ],
        allergies               : [ '' ],

        implants: this.formBuilder.group({
          cochlear_implant      : [ false, [Validators.required] ],
          cardiac_stent         : [ false, [Validators.required] ],
          metal_prostheses      : [ false, [Validators.required] ],
          metal_shards          : [ false, [Validators.required] ],
          pacemaker             : [ false, [Validators.required] ],
          other                 : [ '' ],
          otherBoolean          : [ 'false', [Validators.required] ]
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

  //Override ngOnInit execution to control initial execution manually (Except the first initialization of formBuilder)::
  manualOnInit(res: any): void {
    //Check if element is not empty:
    if(this.sharedProp.current_id != ''){
      //Set min and max dates (Datepicker):
      const dateRangeLimit = this.sharedFunctions.setDateRangeLimit(new Date(this.sharedProp.current_datetime.start)); //Current date

      this.minDate = dateRangeLimit.minDate;
      this.maxDate = dateRangeLimit.maxDate;

      //Find references:
      this.appointmentsService.findReferences();

      //Find referring organizations:
      this.appointmentsService.findReferringOrganizations();

      //Find referring and reporting information:
      this.appointmentsService.findReportingUsers(res.data[0].reporting.service._id, this.form);

      //Set selected reporting:
      const selectedReporting = res.data[0].reporting.organization._id + '.' + res.data[0].reporting.branch._id + '.' + res.data[0].reporting.service._id;

      //Check if inpatient:
      let inpatient = { type: '', where: '', room: '', contact: '' };
      if(res.data[0].inpatient){
        inpatient = res.data[0].inpatient;
      }

      //Check other values (Non-boolean string types):
      let patologiesOther = 'false';
      if(res.data[0].private_health.other !== undefined && res.data[0].private_health.other !== null && res.data[0].private_health.other !== ''){
        //Set checkbox on true (string):
        patologiesOther = 'true';

        //Display input:
        this.appointmentsService.onCheckOtherPatology({ checked: true }, this.form);
      }

      let implantsOther = 'false';
      if(res.data[0].private_health.implants.other !== undefined && res.data[0].private_health.implants.other !== null && res.data[0].private_health.implants.other !== ''){
        //Set checkbox on true (string):
        implantsOther = 'true';

        //Display input:
        this.appointmentsService.onCheckOtherImplants({ checked: true }, this.form);
      }

      //Check use contrast for display or not contrast detail input:
      this.appointmentsService.onChangeContrast({ value: 'true' }, this.form);

      //Check outpatient for display or not inpatient inputs:
      this.appointmentsService.onChangeOutpatient({ value: `${res.data[0].outpatient}` }, this.form);

      //Check flow state for display or not cancellation reasons:
      this.onClickFlowState(res.data[0].flow_state);

      //Send data to the form:
      this.setReactiveForm({
        referring_organization    : res.data[0].referring.organization._id,
        reporting_domain          : selectedReporting,
        reporting_user            : res.data[0].reporting.fk_reporting._id,

        anamnesis                 : res.data[0].anamnesis,
        indications               : res.data[0].indications,
        report_before             : new Date(res.data[0].report_before.slice(0, -8)),
        contact                   : res.data[0].contact,
        status                    : [ `${res.data[0].status}` ], //Use back tip notation to convert string
        flow_state                : res.data[0].flow_state,
        cancellation_reasons      : [ `${res.data[0].cancellation_reasons}` ], //Use back tip notation to convert string

        //Current address fields:
        current_address: this.formBuilder.group({
          country                 : this.sharedFunctions.capitalizeFirstLetter(res.data[0].current_address.country),
          state                   : this.sharedFunctions.capitalizeFirstLetter(res.data[0].current_address.state),
          city                    : this.sharedFunctions.capitalizeFirstLetter(res.data[0].current_address.city),
          neighborhood            : res.data[0].current_address.neighborhood,
          address                 : res.data[0].current_address.address
        }),

        //Contrast fields:
        contrast: this.formBuilder.group({
          use_contrast            : [ `${res.data[0].contrast.use_contrast}` ], //Use back tip notation to convert string
          description             : res.data[0].contrast.description
        }),

        //Private health fields:
        private_health: this.formBuilder.group({
          height                  : res.data[0].private_health.height,
          weight                  : res.data[0].private_health.weight,
          diabetes                : res.data[0].private_health.diabetes,
          hypertension            : res.data[0].private_health.hypertension,
          epoc                    : res.data[0].private_health.epoc,
          smoking                 : res.data[0].private_health.smoking,
          malnutrition            : res.data[0].private_health.malnutrition,
          obesity                 : res.data[0].private_health.obesity,
          hiv                     : res.data[0].private_health.hiv,
          renal_insufficiency     : res.data[0].private_health.renal_insufficiency,
          heart_failure           : res.data[0].private_health.heart_failure,
          ischemic_heart_disease  : res.data[0].private_health.ischemic_heart_disease,
          valvulopathy            : res.data[0].private_health.valvulopathy,
          arrhythmia              : res.data[0].private_health.arrhythmia,
          cancer                  : res.data[0].private_health.cancer,
          dementia                : res.data[0].private_health.dementia,
          claustrophobia          : res.data[0].private_health.claustrophobia,
          asthma                  : res.data[0].private_health.asthma,
          hyperthyroidism         : res.data[0].private_health.hyperthyroidism,
          hypothyroidism          : res.data[0].private_health.hypothyroidism,
          pregnancy               : res.data[0].private_health.pregnancy,
          other                   : res.data[0].private_health.other,
          otherBoolean            : patologiesOther,
          medication              : res.data[0].private_health.medication,
          allergies               : res.data[0].private_health.allergies,

          implants: this.formBuilder.group({
            cochlear_implant      : res.data[0].private_health.implants.cochlear_implant,
            cardiac_stent         : res.data[0].private_health.implants.cardiac_stent,
            metal_prostheses      : res.data[0].private_health.implants.metal_prostheses,
            metal_shards          : res.data[0].private_health.implants.metal_shards,
            pacemaker             : res.data[0].private_health.implants.pacemaker,
            other                 : res.data[0].private_health.implants.other,
            otherBoolean          : implantsOther
          }),

          covid19: this.formBuilder.group({
            had_covid             : res.data[0].private_health.covid19.had_covid,
            vaccinated            : res.data[0].private_health.covid19.vaccinated,
            details               : res.data[0].private_health.covid19.details
          }),
        }),

        outpatient                :  [ `${res.data[0].outpatient}` ], //Use back tip notation to convert string
        inpatient: this.formBuilder.group({
          type                    : [ `${inpatient.type}` ], //Use back tip notation to convert string
          where                   : inpatient.where,
          room                    : inpatient.room,
          contact                 : inpatient.contact
        })
      });

      //Add files into file manager controller:
      if(res.data[0].attached_files.length > 0){
        Promise.all(Object.keys(res.data[0].attached_files).map((key) => {
          this.fileManager.controller['attached_files'].files[res.data[0].attached_files[key]._id] = res.data[0].attached_files[key].name;
        }));
      }

      if(Object.keys(res.data[0].consents).length > 0){
        if(res.data[0].consents.informed_consent !== undefined){
          if(Object.keys(res.data[0].consents.informed_consent).length > 0){
            this.fileManager.controller['informed_consent'].files[res.data[0].consents.informed_consent._id] = res.data[0].consents.informed_consent.name;
          }
        }

        if(res.data[0].consents.clinical_trial !== undefined){
          if(Object.keys(res.data[0].consents.clinical_trial).length > 0){
            this.fileManager.controller['clinical_trial'].files[res.data[0].consents.clinical_trial._id] = res.data[0].consents.clinical_trial.name;
          }
        }
      }

      //Get property keys with values:
      this.sharedProp.current_keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);
    }
  }

  onSubmit(callback = (res: any) => {}){
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
      this.appointmentsService.saveAppointment('update', this.form, this.fileManager, this.sharedProp.current_id, this.sharedProp.current_keysWithValues, (res) => {
        //Execute callback:
        callback(res);
      });
    }
  }

  onClickFlowState(value: any){
    if(value == 'A02'){
      this.booleanCancelation = true;
    } else {
      this.booleanCancelation = false;
    }
  }
}
