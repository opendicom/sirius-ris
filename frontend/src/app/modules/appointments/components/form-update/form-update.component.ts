import { Component, OnInit, ViewChild } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  ISO_3166, 
  document_types, 
  gender_types,
  cancellation_reasons,
  performing_flow_states
} from '@env/environment';

// Child components:
import { TabDetailsComponent } from '@modules/appointments/components/form-update/tab-details/tab-details.component';
import { TabSlotComponent } from '@modules/appointments/components/form-update/tab-slot/tab-slot.component';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form-update',
  templateUrl: './form-update.component.html',
  styleUrls: ['./form-update.component.css']
})
export class FormUpdateComponent implements OnInit {
  //Import tabs components (Properties and Methods) [Child components]:
  @ViewChild(TabDetailsComponent) tabDetails!:TabDetailsComponent;
  @ViewChild(TabSlotComponent) tabSlot!:TabSlotComponent;

  //Set component properties:
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public gender_types           : any = gender_types;
  public performing_flow_states : any = performing_flow_states;
  public cancellation_reasons   : any = cancellation_reasons;

  //Initializate validation tab errors:
  public detailsTabErrors       : boolean = false;

  //Initialize previous:
  public previous : any = undefined;

  //Set visible columns of the previous list:
  public displayedColumns: string[] = [
    'flow_state',
    'date',
    'checkin_time',
    'patient_age',
    'details',
    'domain'
  ];

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Inject services, components and router to the constructor:
  constructor(
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
      content_title : 'Formulario de actualización de cita',
      content_icon  : 'edit_calendar',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('appointments');
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.sharedProp.current_id = this.objRoute.snapshot.params['_id'];

    //Check if element is not empty:
    if(this.sharedProp.current_id != ''){
      //Request params:
      const params = {
        'filter[_id]': this.sharedProp.current_id,
        'proj[attached_files.base64]': 0,
        'proj[consents.informed_consent.base64]': 0,
        'proj[consents.clinical_trial.base64]': 0,
        'proj[imaging.organization.base64_logo]': 0,
        'proj[imaging.organization.base64_cert]': 0,
        'proj[imaging.organization.cert_password]': 0,
        'proj[imaging.branch.base64_logo]': 0,
        'proj[referring.organization.base64_logo]': 0,
        'proj[referring.organization.base64_cert]': 0,
        'proj[referring.organization.cert_password]': 0,
        'proj[referring.branch.base64_logo]': 0,
        'proj[reporting.organization.base64_logo]': 0,
        'proj[reporting.organization.base64_cert]': 0,
        'proj[reporting.organization.cert_password]': 0,
        'proj[reporting.branch.base64_logo]': 0
      };

      //Find element to update:
      this.sharedFunctions.find(this.sharedProp.element, params, (res) => {
        //Check operation status:
        if(res.success === true){

          //Set current data in sharedProp:
          this.setCurrentData(res, () => {

            //Set procedure details:
            this.setProcedureDetails(res.data[0].procedure._id, () => {

              //Excecute manual onInit childrens components:
              this.tabDetails.manualOnInit(res);
              this.tabSlot.manualOnInit();
            });

            //Find previous:
            this.sharedFunctions.findPrevious(res.data[0].patient._id, (objPrevious => {
              this.previous = objPrevious;
            }));
          });
        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + res.message);
          this.router.navigate(['/' + this.sharedProp.element + '/list']);
        }
      });
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  onSubmitMaster(){
    //Check selected element in slot tab:
    if(this.tabSlot.selectedEquipment !== undefined && this.tabSlot.selectedStart !== undefined && this.tabSlot.selectedEnd !== undefined && this.tabSlot.selectedSlot !== undefined){
      //Send first submit in controlled order (Set appointments tab slot info, only if this has changes):
      this.tabSlot.onSubmit((overbooking: Boolean) => {

        //Send second submit in controlled order (Update appointment):
        this.tabDetails.onSubmit((res) => {
          if(res !== false){
            //Set details tab errors:
            this.detailsTabErrors = false;

            //Response the form according to the result:
            this.sharedFunctions.formResponder(res, 'appointments', this.router);
          } else {
            //Set details tab errors:
            this.detailsTabErrors = true;
          }
        }, overbooking); // <-- Send overbooking (true or false)
      });

    } else {
      this.sharedFunctions.sendMessage('Falta seleccionar en la pestaña de Detalles de la coordinación en qué momento se llevará a cabo la cita.')
    }
  }

  async setCurrentData(res: any, callback = () => {}) {
    //Current Study IUID:
    this.sharedProp.current_study_iuid = res.data[0].study_iuid;

    //Current Patient:
    this.sharedProp.current_patient = {
      _id       : res.data[0].patient._id,
      status    : res.data[0].patient.status,
      fk_person : res.data[0].patient.fk_person,
      person    : res.data[0].patient.person
    };

    //Current Flow State:
    this.sharedProp.current_flow_state = res.data[0].flow_state;

    //Current Imaging:
    this.sharedProp.current_imaging = res.data[0].imaging;

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

    //Current Slot:
    this.sharedProp.current_slot = res.data[0].slot._id;

    //Current Datetime:
    this.sharedProp.current_datetime = await this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].start), new Date(res.data[0].end));

    //Current Urgency:
    this.sharedProp.current_urgency = res.data[0].urgency;

    //Current Status:
    this.sharedProp.current_status = res.data[0].status;

    //Execute callback (Control sync exec):
    callback();
  }

  setProcedureDetails(procedure_id: string, callback = () => {}){
    //Set params:
    const params = { 'filter[_id]': procedure_id };

    //Set urgency current value in radio button:
    this.tabSlot.form.controls['urgency'].setValue(this.sharedProp.current_urgency.toString());

    //Find details of the Current Procedure:
    this.sharedFunctions.find('procedures', params, async (procedureRes) => {
      //Check operation status:
      if(procedureRes.success === true){
        //Set current procedure with details:
        this.sharedProp.current_procedure = procedureRes.data[0];

        //Search selected equipment (resource) in procedureRes (await foreach):
        await Promise.all(Object.keys(procedureRes.data[0].equipments).map((key) => {
          if(procedureRes.data[0].equipments[key].fk_equipment == this.sharedProp.current_equipment.fk_equipment){
            //Set selected equipment with remaining values:
            this.sharedProp.current_equipment = procedureRes.data[0].equipments[key];
          }
        }));

        //Execute callback (Control sync exec):
        callback();

      } else {
        //Return to the list with request error message:
        this.sharedFunctions.sendMessage('Error al intentar cargar el procedimiento asociado: ' + procedureRes.message);
        this.router.navigate(['/' + this.sharedProp.element + '/list']);
      }
    });
  }

  adjustFullCalendarToUpdate(){
    //Only coordinated appointments have control in slot tab:
    if(this.sharedProp.current_flow_state == 'A01' && this.sharedProp.current_status === true){
      // Fix FullCalendar bug first Render:
      this.sharedFunctions.fixFullCalendarRender();

      //Go to current appointment date:
      this.tabSlot.calendarComponent.getApi().gotoDate(new Date(this.sharedProp.current_datetime.start));
    }
  }
}
