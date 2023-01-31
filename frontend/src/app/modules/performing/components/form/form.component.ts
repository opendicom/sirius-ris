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
  cancellation_reasons
} from '@env/environment';

// Child components:
import { TabDetailsComponent } from '@modules/performing/components/form/tab-details/tab-details.component';
import { TabPreparationComponent } from '@modules/performing/components/form/tab-preparation/tab-preparation.component';
import { TabAnesthesiaComponent } from '@modules/performing/components/form/tab-anesthesia/tab-anesthesia.component';
import { TabAcquisitionComponent } from '@modules/performing/components/form/tab-acquisition/tab-acquisition.component';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  //Import tabs components (Properties and Methods) [Child components]:
  @ViewChild(TabDetailsComponent) tabDetails!:TabDetailsComponent;
  @ViewChild(TabPreparationComponent) tabPreparation!:TabPreparationComponent;
  @ViewChild(TabAnesthesiaComponent) tabAnesthesia!:TabAnesthesiaComponent;
  @ViewChild(TabAcquisitionComponent) tabAcquisition!:TabAcquisitionComponent;

  //Set component properties:
  public settings             : any = app_setting;
  public country_codes        : any = ISO_3166;
  public document_types       : any = document_types;
  public gender_types         : any = gender_types;
  public performingFS         : any = performing_flow_states;
  public cancellation_reasons : any = cancellation_reasons;

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
      flow_state            : ['P01', [Validators.required]],
      cancellation_reasons  : [ '' ],
      status                : ['true'],
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
        this.sharedFunctions.find('appointments', params, (res) => {
          //Check operation status:
          if(res.success === true){

            //Set current data in sharedProp:
            this.setCurrentAppointmentData(res, () => {
              //Excecute manual onInit childrens components:
              this.tabDetails.manualOnInit(res);
            });
          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + res.message);
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
    //Send first submit in controlled order (Update appointment):
    this.tabDetails.onSubmit((res) => {

      //FIRST TIME 'insert':
      // - SEND MWL.
      // - formResponder -> check-in list component.

      //Response the form according to the result:
      this.sharedFunctions.formResponder(res, 'performing', this.router);
    });
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

}
