import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';           // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  regexObjectId,
  ISO_3166,
  document_types,
  gender_types,
  cancellation_reasons,
  performing_flow_states
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-select-procedure',
  templateUrl: './select-procedure.component.html',
  styleUrls: ['./select-procedure.component.css']
})
export class SelectProcedureComponent implements OnInit {
  //Set component properties:
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public gender_types           : any = gender_types;
  public performing_flow_states : any = performing_flow_states;
  public cancellation_reasons   : any = cancellation_reasons;

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableServices      : any;
  public availableCategories    : any;
  public fkProceduresIN         : string[] = [];
  public availableProcedures    : any;

  //Set appointment_request flag:
  public appointment_request    : any;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Define form_action variables (Activated Route):
  public tabIndex         : number = 0;

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

  //Inject services, components and router to the constructor:
  constructor(
    private router          : Router,
    private objRoute        : ActivatedRoute,
    public formBuilder      : FormBuilder,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ) {
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Paso 02 - Selección de servicio y procedimiento',
      content_icon  : 'health_and_safety',
      add_button    : false,
      filters_form  : false,
    });

    //Set Reactive Form (First time):
    this.setReactiveForm({
      domain            : ['', [Validators.required]],
      id_category       : new FormControl({ value: '', disabled: true }, Validators.required),
      fk_procedure      : new FormControl({ value: '', disabled: true }, Validators.required)
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.appointment_request = this.objRoute.snapshot.params['appointment_request'];

    //Find references:
    this.findReferences();

    //Find previous:
    this.sharedFunctions.findPrevious(this.sharedProp.current_patient._id, (objPrevious => {
      this.previous = objPrevious;
    }));
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList('appointments', this.router);
  }

  setBranch(organization: any, branch: any, service: any, modality: string): void {
    //Check names and _ids:
    if(
      organization._id !== undefined && regexObjectId.test(organization._id) && organization.short_name !== undefined && organization.short_name !== '' &&
      branch._id !== undefined && regexObjectId.test(branch._id) && branch.short_name !== undefined && branch.short_name !== '' &&
      service._id !== undefined && regexObjectId.test(service._id) && service.name !== undefined && service.name !== '' &&
      modality !== undefined && modality !== '' && regexObjectId.test(modality)
    ){
      //Set current imaging:
      this.sharedProp.current_imaging = {
        organization: organization,
        branch: branch,
        service: service
      };

      //Set current modality:
      this.sharedProp.current_modality = modality;
    }
  }

  onChangeService(): void{
    //Check modality and organization and branch _ids:
    if(
      this.sharedProp.current_imaging.organization._id !== undefined && regexObjectId.test(this.sharedProp.current_imaging.organization._id) &&
      this.sharedProp.current_imaging.branch._id !== undefined && regexObjectId.test(this.sharedProp.current_imaging.branch._id) &&
      this.sharedProp.current_modality !== '' && regexObjectId.test(this.sharedProp.current_modality)
    ){
      //Set params:
      const params = {
        'filter[and][domain.organization]': this.sharedProp.current_imaging.organization._id,
        'filter[and][domain.branch]': this.sharedProp.current_imaging.branch._id,
        'filter[and][procedures.fk_modality]': this.sharedProp.current_modality
      };

      //Set available procedures:
      this.sharedFunctions.find('procedure_categories', params, (res) => {
        //Check data:
        if(res.data.length > 0){
          //Set available procedures:
          this.availableCategories = res.data;

          //Enable category input:
          this.form.controls['id_category'].enable();

        } else {
          //Disable inputs:
          this.form.controls['id_category'].disable();
          this.form.controls['fk_procedure'].disable();

          //Clear inputs:
          this.form.controls['id_category'].setValue([]);
          this.form.controls['fk_procedure'].setValue([]);

          //Send message:
          this.sharedFunctions.sendMessage('Advertencia: No se encuentra ninguna categoría de procedimiento cargada en el servicio seleccionado.');
        }
      });
    }
  }

  setProceduresIN(fk_procedures: string[]): void {
    //Set fkProceduresIN:
    if(fk_procedures.length >= 1){
      this.fkProceduresIN = fk_procedures;
    }
  }

  onChangeCategory(): void {
    //Check modality and organization and branch _ids:
    if(
      this.sharedProp.current_imaging.organization._id !== undefined && regexObjectId.test(this.sharedProp.current_imaging.organization._id) &&
      this.sharedProp.current_imaging.branch._id !== undefined && regexObjectId.test(this.sharedProp.current_imaging.branch._id) &&
      this.sharedProp.current_modality !== '' && regexObjectId.test(this.sharedProp.current_modality)
    ){
      //Set params:
      let params : any = {
        'filter[and][domain.organization]': this.sharedProp.current_imaging.organization._id,
        'filter[and][domain.branch]': this.sharedProp.current_imaging.branch._id,
        'filter[and][fk_modality]': this.sharedProp.current_modality,
        'filter[and][status]': true
      };

      //Set procedures filter key:
      if(this.fkProceduresIN.length == 1){
        params['filter[and][_id]'] = this.fkProceduresIN[0];
      } else {
        params['filter[in][_id]'] = this.fkProceduresIN;
      }

      //Set available procedures:
      this.sharedFunctions.find('procedures', params, (res) => {
        //Check data:
        if(res.data.length > 0){
          //Set available procedures:
          this.availableProcedures = res.data;

          //Enable procedure input:
          this.form.controls['fk_procedure'].enable();

        } else {
          //Enable procedure input:
          this.form.controls['fk_procedure'].disable();

          //Clear procedure input:
          this.form.controls['fk_procedure'].setValue([]);

          //Send message:
          this.sharedFunctions.sendMessage('Advertencia: No se encuentra ningún procedimiento cargado en la modalidad del servicio seleccionado.');
        }
      });
    }
  }

  async onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Check fk_procedure:
      if(this.form.value.fk_procedure !== undefined && regexObjectId.test(this.form.value.fk_procedure)){

        //Find all properties of procedure in available procedures:
        await Promise.all(Object.keys(this.availableProcedures).map((key) => {
          if(this.availableProcedures[key]._id == this.form.value.fk_procedure){
            //Set current procedure in shared properties:
            this.sharedProp.current_procedure = {
              '_id'                 : this.availableProcedures[key]._id,
              'name'                : this.availableProcedures[key].name,
              'equipments'          : this.availableProcedures[key].equipments,
              'informed_consent'    : this.availableProcedures[key].informed_consent,
              'preparation'         : this.availableProcedures[key].preparation,
              'procedure_template'  : this.availableProcedures[key].procedure_template,
              'reporting_delay'     : this.availableProcedures[key].reporting_delay
            }
          }
        }));

        //Check appointment request:
        if(this.appointment_request !== undefined && this.sharedFunctions.stringToBoolean(this.appointment_request) && this.sharedProp.current_appointment_request !== undefined){
          //Redirect to select slot form (Preserve activate route field):
          this.router.navigate(['/appointments/select_slot/true']);
        } else {
          //Redirect to select slot form:
          this.router.navigate(['/appointments/select_slot']);
        }
      } else {
        //Send message:
        this.sharedFunctions.sendMessage('Advertencia: El procedimiento indicado NO posee un _id válido (ObjectId).');
      }
    }
  }

  findReferences(){
    //Initialize params:
    const params = { 'filter[status]': true };

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
