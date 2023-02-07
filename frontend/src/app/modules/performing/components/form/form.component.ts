import { Component, OnInit, ViewChild } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  app_setting, 
  ISO_3166, 
  document_types, 
  gender_types, 
  performing_flow_states,
  cancellation_reasons,
  CKEditorConfig
} from '@env/environment';
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';               // CKEditor

// Child components:
import { TabDetailsComponent } from '@modules/performing/components/form/tab-details/tab-details.component';
import { stat } from 'fs';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  //Import tabs components (Properties and Methods) [Child components]:
  @ViewChild(TabDetailsComponent) tabDetails!:TabDetailsComponent;

  //Set component properties:
  public settings             : any = app_setting;
  public country_codes        : any = ISO_3166;
  public document_types       : any = document_types;
  public gender_types         : any = gender_types;
  public performingFS         : any = performing_flow_states;
  public cancellation_reasons : any = cancellation_reasons;

  //Create CKEditor component and configure them:
  public procedureEditor                = customBuildEditor;
  public acquisitionObservationsEditor  = customBuildEditor;
  public injectionObservationsEditor    = customBuildEditor;
  public editorConfig                   = CKEditorConfig;

  //Initializate validation tab errors:
  public detailsTabErrors       : boolean = false;
  public injectionTabErrors     : boolean = false;
  public anesthesiaTabErrors    : boolean = false;
  public acquisitionTabErrors   : boolean = false;

  //Initialize Technician Users:
  public technicianUsers        : any = [];

  //Boolean class binding objects:
  public booleanAnesthesia      : Boolean = false;

  //Create CKEditor validator:
  public anesthesiaValidator = true;

  //Set references objects:
  public availableProcedures    : any;
  public availableEquipments    : any;

  //Initialize local current objects:
  public current_branch_id      : string = '';
  public current_modality_id    : string = '';
  public current_procedure_id   : string = '';

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public _id: string = '';
  private keysWithValues: Array<string> = [];
  public form_action: any;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Boolean class binding objects:
  public booleanCancelation : Boolean = false;

  //Set checkin_time:
  public checkin_time = this.setCheckInTime();

  //Inject services, components and router to the constructor:
  constructor(
    public formBuilder          : FormBuilder,
    private router              : Router,
    private objRoute            : ActivatedRoute,
    public sharedProp           : SharedPropertiesService,
    public sharedFunctions      : SharedFunctionsService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de realización de estudio',
      content_icon  : 'assignment_ind',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('performing');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      flow_state                : ['P01', [Validators.required]],
      fk_equipment              : [ '', [Validators.required]],
      fk_procedure              : [ '', [Validators.required]],
      cancellation_reasons      : [ '' ],
      status                    : ['true'],
      urgency                   : ['false'],  // First time preserve appointment value.
      observations              : [ '' ],

      //Injection fields:
      injection: this.formBuilder.group({
        'enabled'               : [ 'false' ],  //Enable or disable injection fields.
        'administered_volume'   : [ '', [Validators.required]],
        'administration_time'   : [ '', [Validators.required]],
        'injection_user'        : [ '', [Validators.required]],

        //PET-CT fields:
        pet_ct: this.formBuilder.group({
          'batch'                   : [ '' ],
          'syringe_activity_full'   : [ '', [Validators.required]],
          'syringe_activity_empty'  : [ '', [Validators.required]],
          'administred_activity'    : [ '', [Validators.required]],
          'syringe_full_time'       : [ '', [Validators.required]],
          'syringe_empty_time'      : [ '', [Validators.required]],
        })
      }),

      //Anesthesia fields:
      anesthesia: this.formBuilder.group({
        'use_anesthesia'        : [ 'false', [Validators.required] ],  //Enable or disable anesthesia fields.
        'professional_id'       : [ '' ],
        'document'              : [ '' ],
        'name'                  : [ '' ],
        'surname'               : [ '' ],
        'procedure'             : [ '' ],
      }),
      
      //Acquisition fields:
      acquisition: this.formBuilder.group({
        'time'                  : [ '', [Validators.required]],
        'console_technician'    : [ '', [Validators.required]],
        'observations'          : [ '' ]
      }),
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];

    //Switch by form action:
    switch(this.form_action){
      case 'insert':
        //Extract sent data (Parameters by routing).
        //In the case 'insert' the _id is fk_appointment.
        this.sharedProp.current_appointment = this.objRoute.snapshot.params['_id'];

        //Request params:
        const params = {
          'filter[_id]': this.sharedProp.current_appointment,
          'proj[attached_files.base64]': 0,
          'proj[consents.informed_consent.base64]': 0,
          'proj[consents.clinical_trial.base64]': 0
        };

        //Find element to update:
        this.sharedFunctions.find('appointments', params, (resAppointments) => {
          //Check operation status:
          if(resAppointments.success === true){
            //Set current local objects:
            this.current_branch_id = resAppointments.data[0].imaging.branch._id;
            this.current_modality_id = resAppointments.data[0].modality._id;
            this.current_procedure_id = resAppointments.data[0].procedure._id;
            
            //Find available equipments and available procedures for selected equipment:
            this.setEquipment(resAppointments.data[0].slot.fk_equipment);

            //Find service users (Technicians):
            this.sharedFunctions.findServiceUsers(resAppointments.data[0].imaging.service._id, 5, (resServiceUsers) => {
              //Check data:
              if(resServiceUsers.data.length > 0){
                //Set technician users:
                this.technicianUsers = resServiceUsers.data;
              } else {
                //Clear previous values:
                this.technicianUsers = [];
                this.form.get('acquisition.console_technician')?.setValue('');

                //Send message:
                this.sharedFunctions.sendMessage('Advertencia: El servicio seleccionado NO tiene asignado ningún técnico.');
              }
            });

            //Set current data in sharedProp:
            this.setCurrentAppointmentData(resAppointments, () => {
              //Excecute manual onInit childrens components:
              this.tabDetails.manualOnInit(resAppointments);
            });

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + resAppointments.message);
            this.router.navigate(['/' + this.sharedProp.element + '/list']);
          }
        });

        break;

      case 'update':
        //Extract sent data (Parameters by routing).
        //In the case 'update' the _id is performing _id.
        this.sharedProp.current_id = this.objRoute.snapshot.params['_id'];
        
        break;

      default:
        //Return to the list with request error message:
        this.sharedFunctions.sendMessage('Error al intentar editar el elemento: La acción indicada sobre el formulario es incorrecta [insert | update].');

        //Redirect to the list:
        this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
        break;
    }
  }

  onSubmitMaster(){
    //Fix Angular validate:
    //Required validator doesn't effect the input fields, if you don't mark them as dirty, when they are in pristine state.
    this.form.markAllAsTouched();

    //Validate CKEditor anesthesia (min length 10 + 7 chars [<p></p>]):
    if(this.form.value.anesthesia.procedure.length < 17){
      this.anesthesiaValidator = false;
    } else {
      this.anesthesiaValidator = true;
    }

    //Check details tab errors:
    if(this.tabDetails.form.status == 'VALID'){
      this.detailsTabErrors = false;
    } else {
      this.detailsTabErrors = true;
    }

    //Check injection tab errors:
    if(this.form.controls['injection'].status == 'VALID'){
      this.injectionTabErrors = false;
    } else {
      this.injectionTabErrors = true;
    }

    //Check anesthesia tab errors:
    if(this.form.controls['anesthesia'].status == 'VALID'){
      this.anesthesiaTabErrors = false;
    } else {
      this.anesthesiaTabErrors = true;
    }

    //Check acquisition tab errors:
    if(this.form.controls['acquisition'].status == 'VALID'){
      this.acquisitionTabErrors = false;
    } else {
      this.acquisitionTabErrors = true;
    }

    //Validate fields:
    if(this.form.valid){
      //Send first submit in controlled order (Update appointment):
      this.tabDetails.onSubmit((res) => {

        //FIRST TIME 'insert':
        // - SEND MWL.
        // - formResponder -> check-in list component.

        //Response the form according to the result:
        this.sharedFunctions.formResponder(res, 'performing', this.router);
      });
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  async setCurrentAppointmentData(res: any, callback = () => {}) {
    //Current Study IUID:
    this.sharedProp.current_study_iuid = res.data[0].study_iuid;

    //Current Patient:
    this.sharedProp.current_patient = {
      _id       : res.data[0].patient._id,
      status    : res.data[0].patient.status,
      fk_person : res.data[0].patient.fk_person,
      person    : res.data[0].patient.person
    };

    //Current Imaging:
    this.sharedProp.current_imaging = res.data[0].imaging;

    //Check if it is the first time to set the values of the appointment (insert):
    if(this.form_action == 'insert'){
      //Current Modality:
      this.sharedProp.current_modality = res.data[0].modality;

      //Set Current procedure with which it comes from the appointment until you get the details (Temp):
      this.sharedProp.current_procedure = res.data[0].procedure;

      //Set Current Equipment with which it comes from the appointment until you get the remaining values (Temp):
      this.sharedProp.current_equipment = {
        fk_equipment: res.data[0].slot.equipment._id,
        details: {
          name  : res.data[0].slot.equipment.name,
          AET   : res.data[0].slot.equipment.AET
        }
      };
    }

    //Current Datetime:
    this.sharedProp.current_datetime = await this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].start), new Date(res.data[0].end));

    //Current Urgency:
    this.sharedProp.current_urgency = res.data[0].urgency;

    //Execute callback (Control sync exec):
    callback();
  }

  setCheckInTime(): string {
    //Get current date (time):
    const now = new Date();

    //Extract hours and minutes:
    const hours    = this.sharedFunctions.addZero(now.getHours());
    const minutes  = this.sharedFunctions.addZero(now.getMinutes());
    
    //Return result (string):
    return hours + ':' + minutes;
  }

  findAvailableEquipments(callback = (res: any) => {}){
    //Set params:
    let params : any = {
      'filter[fk_branch]': this.current_branch_id,
      'filter[fk_modalities]': this.current_modality_id
    };

    //Check status (insert case only status true):
    if(this.form_action == 'insert'){
      params['filter[status]'] = true;
    }

    //Set available equipments:
    this.sharedFunctions.find('equipments', params, (res) => {
      //Check data:
      if(res.data.length > 0){
        //Set available equipments:
        this.availableEquipments = res.data;

        //Execute callback:
        callback(res);
      } else {
        //Send message:
        this.sharedFunctions.sendMessage('Advertencia: No se encuentra ningún equipo cargado en la modalidad sobre la sucursal donde se realizó la coordinación.');
      }
    });
  }

  findAvailableProcedures(equipment_id: string, callback = (res: any) => {}){
    //Set params:
    let params : any = {
      'filter[equipments.fk_equipment]': equipment_id,
      'filter[fk_modality]': this.current_modality_id
    };

    //Check status (insert case only status true):
    if(this.form_action == 'insert'){
      params['filter[status]'] = true;
    }
    
    //Set available procedures:
    this.sharedFunctions.find('procedures', params, (res) => {
      //Check data:
      if(res.data.length > 0){
        //Set available procedures:
        this.availableProcedures = res.data;

        //Execute callback:
        callback(res);
      } else {
        //Send message:
        this.sharedFunctions.sendMessage('Advertencia: No se encuentra ningún procedimiento cargado en la modalidad del servicio coordinado.');
      }
    });
  }

  setEquipment(equipment_id: string){
    //Find available equipments:
    this.findAvailableEquipments((resEquipments) => {
      //Set equipment:
      this.form.controls['fk_equipment'].setValue(equipment_id);

      //Find available procedures for selected equipment:
      this.findAvailableProcedures(equipment_id, (resProcedures) => {
        //Set current procedure:
        this.form.controls['fk_procedure'].setValue(this.current_procedure_id);
      });
    });
  }

  setProcedure(procedure_id: string){
    //Set current procedure _id:
    this.current_procedure_id = procedure_id; 
  }

  onChangeAnesthesia(event: any, form: FormGroup){
    if(event.value == 'true'){
      //Display inputs:
      this.booleanAnesthesia = true;

      //Enable validators:
      this.form.get('anesthesia.professional_id')?.setValidators([Validators.required]);
      this.form.get('anesthesia.document')?.setValidators([Validators.required]);
      this.form.get('anesthesia.name')?.setValidators([Validators.required]);
      this.form.get('anesthesia.surname')?.setValidators([Validators.required]);
      this.form.get('anesthesia.procedure')?.setValidators([Validators.required]);

      this.form.get('anesthesia.professional_id')?.updateValueAndValidity();
      this.form.get('anesthesia.document')?.updateValueAndValidity();
      this.form.get('anesthesia.name')?.updateValueAndValidity();
      this.form.get('anesthesia.surname')?.updateValueAndValidity();
      this.form.get('anesthesia.procedure')?.updateValueAndValidity();

    } else {
      //Clear inputs:
      form.get('anesthesia.professional_id')?.setValue('');
      form.get('anesthesia.document')?.setValue('');
      form.get('anesthesia.name')?.setValue('');
      form.get('anesthesia.surname')?.setValue('');
      form.get('anesthesia.procedure')?.setValue('');

      //Remove validators:
      this.form.get('anesthesia.professional_id')?.clearValidators();
      this.form.get('anesthesia.document')?.clearValidators();
      this.form.get('anesthesia.name')?.clearValidators();
      this.form.get('anesthesia.surname')?.clearValidators();
      this.form.get('anesthesia.procedure')?.clearValidators();

      this.form.get('anesthesia.professional_id')?.updateValueAndValidity();
      this.form.get('anesthesia.document')?.updateValueAndValidity();
      this.form.get('anesthesia.name')?.updateValueAndValidity();
      this.form.get('anesthesia.surname')?.updateValueAndValidity();
      this.form.get('anesthesia.procedure')?.updateValueAndValidity();

      //Hide inputs:
      this.booleanAnesthesia = false;
    }
  }
}
