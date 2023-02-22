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

  //Initializate available flow states:
  public availableFS            : any = {};

  //Initialize Technician Users:
  public technicianUsers        : any = [];

  //Boolean class binding objects:
  public booleanAnesthesia      : Boolean = false;
  public booleanContrast        : Boolean = false;

  //Create CKEditor validator:
  public anesthesiaValidator = true;

  //Set references objects:
  public availableProcedures    : any;
  public availableEquipments    : any;

  //Initialize local current objects:
  public current_branch_id            : string = '';
  public current_modality_id          : string = '';
  public current_procedure_id         : string = '';

  //Initializate performing local current flow state:
  public current_flow_state           : string = 'P01';

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
  public checkin_time = this.getTimeNow();

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
      flow_state                : [ this.current_flow_state, [Validators.required]],
      fk_equipment              : [ '', [Validators.required]],
      fk_procedure              : [ '', [Validators.required]],
      cancellation_reasons      : [ '' ],
      status                    : ['true'],
      urgency                   : ['false'],  // First time preserve appointment value.
      observations              : [ '' ],

      //Injection fields:
      injection: this.formBuilder.group({
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
        'time'                  : [ '' ],
        'console_technician'    : [ '' ],
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

        //Set available flow states:
        this.setAvailableFlowStates('P01');

        //Set flow state (first time | enable validators):
        this.setFlowState('P01');

        //Find referenced appointment:
        this.findReferencedAppointment('check-in');

        break;

      case 'update':
        //Extract sent data (Parameters by routing).
        //In the case 'update' the _id is performing _id.
        this.sharedProp.current_id = this.objRoute.snapshot.params['_id'];

        //Set performing params:
        const performing_params = {
          'filter[_id]': this.sharedProp.current_id
        };
        
        //Find element to update (findById):
        this.sharedFunctions.find('performing', performing_params, (resPerforming) => {
          //Ininitalizate optional objects controllers:
          let hasAnesthesia = false;

          //Check operation status:
          if(resPerforming.success === true){
            //Set checkin_time:
            this.checkin_time = resPerforming.data[0].date.split('T')[1].slice(0,5);

            //Set current appointment:
            this.sharedProp.current_appointment = resPerforming.data[0].fk_appointment;

            //Find referenced appointment:
            this.findReferencedAppointment('performing');

            //Set Current procedure:
            this.sharedProp.current_procedure = resPerforming.data[0].fk_procedure;
            //this.setProcedure(resPerforming.data[0].fk_procedure, resPerforming.data[0].procedure.coefficient);  CONTINUAR ACA!!!

            //Set Current Equipment:
            this.sharedProp.current_equipment = {
              fk_equipment: resPerforming.data[0].fk_equipment,
              details: {
                name  : resPerforming.data[0].equipment.name,
                AET   : resPerforming.data[0].equipment.AET
              }
            };
            //this.setEquipment(resPerforming.data[0].fk_equipment); CONTINUAR ACA!!!

            //Set available flow states:
            this.setAvailableFlowStates(resPerforming.data[0].flow_state);

            //Check if exist anesthesia property in current performing:
            if(resPerforming.data[0].hasOwnProperty('anesthesia')){
              hasAnesthesia = true;
            }

            //Send data to the form:
            this.setReactiveForm({
              flow_state                : [ resPerforming.data[0].flow_state, [Validators.required]],
              fk_equipment              : [ resPerforming.data[0].fk_equipment, [Validators.required]],
              fk_procedure              : [ resPerforming.data[0].fk_procedure, [Validators.required]],
              cancellation_reasons      : [ '' ],
              status                    : [ `${resPerforming.data[0].status}` ], //Use back tip notation to convert string
              urgency                   : [ `${resPerforming.data[0].urgency}` ], //Use back tip notation to convert string
              observations              : [ resPerforming.data[0].observations ],
        
              //Injection fields:
              /*
              injection: this.formBuilder.group({
                'administered_volume'   : [ resPerforming.data[0].injection.administered_volume, [Validators.required]],
                'administration_time'   : [ resPerforming.data[0].injection.administration_time, [Validators.required]],
                'injection_user'        : [ resPerforming.data[0].injection.injection_user, [Validators.required]],
        
                //PET-CT fields:
                pet_ct: this.formBuilder.group({
                  'batch'                   : [ resPerforming.data[0].injection.pet_ct.batch ],
                  'syringe_activity_full'   : [ resPerforming.data[0].injection.pet_ct.syringe_activity_full, [Validators.required]],
                  'syringe_activity_empty'  : [ resPerforming.data[0].injection.pet_ct.syringe_activity_empty, [Validators.required]],
                  'administred_activity'    : [ resPerforming.data[0].injection.pet_ct.administred_activity, [Validators.required]],
                  'syringe_full_time'       : [ resPerforming.data[0].injection.pet_ct.syringe_full_time, [Validators.required]],
                  'syringe_empty_time'      : [ resPerforming.data[0].injection.pet_ct.syringe_empty_time, [Validators.required]],
                })
              }),
              */
        
              //Anesthesia fields:
              /*
              anesthesia: this.formBuilder.group({
                'use_anesthesia'        : [ `${hasAnesthesia}`, [Validators.required] ], //Use back tip notation to convert string | Enable or disable anesthesia fields.
                'professional_id'       : [ resPerforming.data[0].anesthesia.professional_id ],
                'document'              : [ resPerforming.data[0].anesthesia.document ],
                'name'                  : [ resPerforming.data[0].anesthesia.name ],
                'surname'               : [ resPerforming.data[0].anesthesia.surname ],
                'procedure'             : [ resPerforming.data[0].anesthesia.procedure ],
              }),
              */

              //Acquisition fields:
              /*
              acquisition: this.formBuilder.group({
                'time'                  : [ resPerforming.data[0].acquisition.time ],
                'console_technician'    : [ resPerforming.data[0].acquisition.console_technician ],
                'observations'          : [ resPerforming.data[0].acquisition.observations ]
              }),
              */
            });

            //Set flow state (enable validators):
            this.setFlowState(resPerforming.data[0].flow_state);

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + resPerforming.message);
            this.router.navigate(['/' + this.sharedProp.element + '/list']);
          }
        });

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
    if(this.form.value.hasOwnProperty('injection')){
      if(this.form.controls['injection'].status == 'VALID'){
        this.injectionTabErrors = false;
      } else {
        this.injectionTabErrors = true;
      }
    } else {
      this.injectionTabErrors = false;
    }

    //Check anesthesia tab errors:
    if(this.form.controls['anesthesia'].status == 'VALID'){
      this.anesthesiaTabErrors = false;
    } else {
      this.anesthesiaTabErrors = true;
    }

    //Check acquisition tab errors:
    if(this.form.value.hasOwnProperty('acquisition')){
      if(this.form.controls['acquisition'].status == 'VALID'){
        this.acquisitionTabErrors = false;
      } else {
        this.acquisitionTabErrors = true;
      }
    } else {
      this.acquisitionTabErrors = false;
    }
    
    //Validate fields:
    if(this.form.valid){
      //Check cancellation reasons value:
      if(this.form.value.flow_state !== 'P08'){
        //Delete to prevent validation backend error:
        delete this.form.value.cancellation_reasons;
      }

      //Check anesthesia value:
      if(this.form.value.hasOwnProperty('anesthesia') && this.form.value.anesthesia.use_anesthesia == 'false'){
        //Delete to prevent validation backend error:
        delete this.form.value.anesthesia;
      }

      //Check performing observations:
      if(this.form.value.hasOwnProperty('observations') && this.form.value.observations.length == 0){
        //Delete to prevent validation backend error:
        delete this.form.value.observations;
      }

      //Data normalization - Booleans types (mat-option cases):
      if(typeof this.form.value.status != "boolean"){ this.form.value.status = this.form.value.status.toLowerCase() == 'true' ? true : false; }
      if(typeof this.form.value.urgency != "boolean"){ this.form.value.urgency = this.form.value.urgency.toLowerCase() == 'true' ? true : false; }

      //Check current action:
      if(this.form_action == 'insert'){
        //Set fk_appointment in form:
        this.form.value.fk_appointment = this.sharedProp.current_appointment;

        //Set check-in time in form:
        this.form.value.checkin_time = this.checkin_time;
      }

      //Save performing data:
      this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, this.form.value, this.keysWithValues, (resPerforming) => {
        //Handle messages and destinations by form action:
        let message = '';
        let destination = '';

        switch(this.form_action){
          case 'insert':
            message = 'insertar';
            destination = 'check-in';
            break;

          case 'update':
            message = 'editar';
            destination = 'performing';
            break;
        }

        //Check operation status:
        if(resPerforming.success === true){
          //Send second submit in controlled order (Update appointment):
          this.tabDetails.onSubmit((resAppointments) => {
            //Send patient to MWL according flow state ('P04'):
            //this.sharedFunctions.sendToMWL(this.sharedProp.current_appointment, false, { element: 'appointments' });
            
            //Response the form according to the result:
            this.sharedFunctions.formResponder(resAppointments, destination, this.router);

          });
        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage('Error al intentar ' + message + ' el elemento: ' + resPerforming.message);
        }
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

    //Current Modality:
    this.sharedProp.current_modality = res.data[0].modality;

    //Check if it is the first time to set the values of the appointment (insert):
    if(this.form_action == 'insert'){
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

  getTimeNow(): string {
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

  setProcedure(procedure_id: string, coefficient: any){
    //Set current procedure _id:
    this.current_procedure_id = procedure_id;

    //Calculate recomended dose if modality is PT:
    if(this.sharedProp.current_modality_code_value == 'PT'){
      //Check coefficient:
      if(coefficient !== undefined && coefficient !== null && coefficient !== ''){
        //Set current coefficient:
        this.sharedProp.current_coefficient = coefficient;
      }
    
      //Calculate recomended dose:
      this.sharedProp.recomended_dose = this.sharedFunctions.calculateDose(this.sharedProp.current_weight, this.sharedProp.current_coefficient);
    }
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

  setFlowState(flow_state: any){
    //Set current flow state:
    this.current_flow_state = flow_state.toString(); 

    //Set validators according current flow state:
    switch(this.current_flow_state){
      case 'P01': // Recepción
      case 'P02': // Entrevista
      case 'P03': // Preparación/Inyección
        //Remove all validators:
        this.setValidators('acquisition', 'remove');
        this.setValidators('injection', 'remove');
        this.setValidators('pet_ct', 'remove');
        break;

      case 'P04': // Adquisición
        //Remove acquisition validators:
        this.setValidators('acquisition', 'remove');

        //Enable injection validators if applicable:
        if(this.booleanContrast == true){
          //Enable injection validators:
          this.setValidators('injection', 'enable');

          //Enable PET validators if applicable:
          if(this.sharedProp.current_modality_code_value == 'PT'){
            //Enable PET validators:
            this.setValidators('pet_ct', 'enable');
          }
        }
        break;

      case 'P05': // Verificación de imágenes
      case 'P06': // Para informar
      case 'P07': // Terminado (sin informe)
        //Enable acquisition validators:
        this.setValidators('acquisition', 'enable');

        //Enable injection validators if applicable:
        if(this.booleanContrast == true){
          //Enable injection validators:
          this.setValidators('injection', 'enable');

          //Enable PET validators if applicable:
          if(this.sharedProp.current_modality_code_value == 'PT'){
            //Enable PET validators:
            this.setValidators('pet_ct', 'enable');
          }
        }
        break;

      case 'P08': // Cancelado
        //Remove all validators:
        this.setValidators('acquisition', 'remove');
        this.setValidators('injection', 'remove');
        this.setValidators('pet_ct', 'remove');
        break;
    }
  }

  setValidators(element: string, operation: string){
    switch(element){
      case 'injection':
        switch(operation){
          case 'enable':
            //Enable injection validators:
            this.form.get('injection.administered_volume')?.setValidators([Validators.required]);
            this.form.get('injection.administration_time')?.setValidators([Validators.required]);
            this.form.get('injection.injection_user')?.setValidators([Validators.required]);
            this.form.get('injection.administered_volume')?.updateValueAndValidity();
            this.form.get('injection.administration_time')?.updateValueAndValidity();
            this.form.get('injection.injection_user')?.updateValueAndValidity();

            //Enable injection inputs:
            this.form.get('injection.administered_volume')?.enable();
            this.form.get('injection.administration_time')?.enable();
            this.form.get('injection.injection_user')?.enable();
            break;

          case 'remove':
            //Remove injection validators:
            this.form.get('injection.administered_volume')?.clearValidators();
            this.form.get('injection.administration_time')?.clearValidators();
            this.form.get('injection.injection_user')?.clearValidators();
            this.form.get('injection.administered_volume')?.updateValueAndValidity();
            this.form.get('injection.administration_time')?.updateValueAndValidity();
            this.form.get('injection.injection_user')?.updateValueAndValidity();

            //Disable injection inputs:
            this.form.get('injection.administered_volume')?.disable();
            this.form.get('injection.administration_time')?.disable();
            this.form.get('injection.injection_user')?.disable();
            break;
        }
        break;

      case 'pet_ct':
        switch(operation){
          case 'enable':
            //Enable PET validators:
            this.form.get('injection.pet_ct.syringe_activity_full')?.setValidators([Validators.required]);
            this.form.get('injection.pet_ct.syringe_activity_empty')?.setValidators([Validators.required]);
            this.form.get('injection.pet_ct.administred_activity')?.setValidators([Validators.required]);
            this.form.get('injection.pet_ct.syringe_full_time')?.setValidators([Validators.required]);
            this.form.get('injection.pet_ct.syringe_empty_time')?.setValidators([Validators.required]);
            this.form.get('injection.pet_ct.syringe_activity_full')?.updateValueAndValidity();
            this.form.get('injection.pet_ct.syringe_activity_empty')?.updateValueAndValidity();
            this.form.get('injection.pet_ct.administred_activity')?.updateValueAndValidity();
            this.form.get('injection.pet_ct.syringe_full_time')?.updateValueAndValidity();
            this.form.get('injection.pet_ct.syringe_empty_time')?.updateValueAndValidity();

            //Enable PET inputs:
            this.form.get('injection.pet_ct.batch')?.enable();
            this.form.get('injection.pet_ct.syringe_activity_full')?.enable();
            this.form.get('injection.pet_ct.syringe_activity_empty')?.enable();
            this.form.get('injection.pet_ct.administred_activity')?.enable();
            this.form.get('injection.pet_ct.syringe_full_time')?.enable();
            this.form.get('injection.pet_ct.syringe_empty_time')?.enable();
            break;

          case 'remove':
            //Remove PET validators:
            this.form.get('injection.pet_ct.syringe_activity_full')?.clearValidators();
            this.form.get('injection.pet_ct.syringe_activity_empty')?.clearValidators();
            this.form.get('injection.pet_ct.administred_activity')?.clearValidators();
            this.form.get('injection.pet_ct.syringe_full_time')?.clearValidators();
            this.form.get('injection.pet_ct.syringe_empty_time')?.clearValidators();
            this.form.get('injection.pet_ct.syringe_activity_full')?.updateValueAndValidity();
            this.form.get('injection.pet_ct.syringe_activity_empty')?.updateValueAndValidity();
            this.form.get('injection.pet_ct.administred_activity')?.updateValueAndValidity();
            this.form.get('injection.pet_ct.syringe_full_time')?.updateValueAndValidity();
            this.form.get('injection.pet_ct.syringe_empty_time')?.updateValueAndValidity();

            //Disable PET inputs:
            this.form.get('injection.pet_ct.batch')?.disable();
            this.form.get('injection.pet_ct.syringe_activity_full')?.disable();
            this.form.get('injection.pet_ct.syringe_activity_empty')?.disable();
            this.form.get('injection.pet_ct.administred_activity')?.disable();
            this.form.get('injection.pet_ct.syringe_full_time')?.disable();
            this.form.get('injection.pet_ct.syringe_empty_time')?.disable();
            break;
        }
        break;

      case 'acquisition':
        switch(operation){
          case 'enable':
            //Enable acquisition validators:
            this.form.get('acquisition.time')?.setValidators([Validators.required]);
            this.form.get('acquisition.console_technician')?.setValidators([Validators.required]);
            this.form.get('acquisition.time')?.updateValueAndValidity();
            this.form.get('acquisition.console_technician')?.updateValueAndValidity();

            //Enable acquisition inputs:
            this.form.get('acquisition.time')?.enable();
            this.form.get('acquisition.console_technician')?.enable();
            this.form.get('acquisition.observations')?.enable();
            break;

          case 'remove':
            //Remove acquisition validators:
            this.form.get('acquisition.time')?.clearValidators();
            this.form.get('acquisition.console_technician')?.clearValidators();
            this.form.get('acquisition.time')?.updateValueAndValidity();
            this.form.get('acquisition.console_technician')?.updateValueAndValidity();

            //Disable acquisition inputs:
            this.form.get('acquisition.time')?.disable();
            this.form.get('acquisition.console_technician')?.disable();
            this.form.get('acquisition.observations')?.disable();
            break;
        }
        break;
    }
  }

  async setAvailableFlowStates(currentFS: string){
    //Initialize found flag:
    let foundFlag = false;

    //Loop in enviroment flow states list (await foreach):
    await Promise.all(Object.keys(this.performingFS).map((key) => {
      //Check that currentFS is equal to key or that currentFS has already been entered/found:
      if(currentFS === key || foundFlag){
        //Add current flow state into available flow states:
        this.availableFS[key] = this.performingFS[key];

        //Set found flag as true:
        foundFlag= true;
      }
    }));
  }

  setTimeNow(input_name: string){
    //Check if is disabled input:
    if(this.form.get(input_name)?.status !== 'DISABLED'){
      this.form.get(input_name)?.setValue(this.getTimeNow());
    }
  }

  findReferencedAppointment(destination: string){
    //Set appointments params:
    const appointments_params = {
      'filter[_id]': this.sharedProp.current_appointment,
      'proj[attached_files.base64]': 0,
      'proj[consents.informed_consent.base64]': 0,
      'proj[consents.clinical_trial.base64]': 0
    };

    this.sharedFunctions.find('appointments', appointments_params, (resAppointments) => {
      //Check operation status:
      if(resAppointments.success === true){
        //Set current objects:
        this.current_branch_id = resAppointments.data[0].imaging.branch._id;
        this.current_modality_id = resAppointments.data[0].modality._id;
        this.sharedProp.current_modality_code_value = resAppointments.data[0].modality.code_value;
        this.current_procedure_id = resAppointments.data[0].procedure._id;

        //Calculate recomended dose if modality is PT:
        if(this.sharedProp.current_modality_code_value == 'PT'){
          //Set sharedProp current objects (PET Dose):
          this.sharedProp.current_weight = resAppointments.data[0].private_health.weight;
          this.sharedProp.current_coefficient = resAppointments.data[0].procedure.coefficient;

          //Calculate recomended dose:
          this.sharedProp.recomended_dose = this.sharedFunctions.calculateDose(this.sharedProp.current_weight, this.sharedProp.current_coefficient);
        }

        //Set whether to use contrast:
        this.booleanContrast = resAppointments.data[0].contrast.use_contrast;
        
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
        this.router.navigate(['/' + destination + '/list']);
      }
    });
  }
}
