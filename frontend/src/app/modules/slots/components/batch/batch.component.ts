import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                               // Router
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';       // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { ApiClientService } from '@shared/services/api-client.service';                 // API Client Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.css']
})
export class BatchComponent implements OnInit {
  //Set references objects:
  public availableOrganizations: any;
  public availableBranches: any;
  public availableServices: any;
  public availableModalities: any;
  public availableEquipments: any;

  //Initialize selected elements:
  private selectedBranch: string = '';
  private selectedEquipments: string[] = [];

  //Min and max dates:
  public minDate: Date;
  public maxDate: Date;

  //Initialize days of week arrays to checkbox:
  public daysOfWeek: string[] = [ 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado' ];
  public selectedDays: boolean[] = [ false, false, false, false, false, false, false ];

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public _id: string = '';
  public form_action: any;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services, components and router to the constructor:
  constructor(
    public formBuilder: FormBuilder,
    private router: Router,
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService,
    private apiClient: ApiClientService
  ){
    //Set min and max dates (Datepicker):
    const dateRangeLimit = this.sharedFunctions.setDateRangeLimit(new Date()); //Today
    this.minDate = dateRangeLimit.minDate;
    this.maxDate = dateRangeLimit.maxDate;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Generar lote de turnos',
      content_icon  : 'content_copy',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('slots');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      domain            : ['', [Validators.required]],
      fk_equipment      : new FormControl({ value: '', disabled: true }, Validators.required),
      range_start       : ['', [Validators.required]],
      range_end         : ['', [Validators.required]],
      day               : this.formBuilder.array(Object.keys(this.daysOfWeek).map(key => false), Validators.required),
      start             : ['', [Validators.required]],
      end               : ['', [Validators.required]],
      urgency           : ['false']
    });
  }

  ngOnInit(): void {
    //Find references:
    this.findReferences();
  }

  onCheckDay(event: any, key: number){
    //Set current check into selectedDays array:
    this.selectedDays[key] = event.checked;

    //Send data to FormControl:
    this.form.controls['day'].setValue(this.selectedDays);
  }

  setBranch(fk_branch: string, fk_equipments: any = false): void {
    //Clear selected equipments:
    this.selectedEquipments = [];

    //Set selected elements:
    this.selectedBranch = fk_branch;

    //Check fk_equipments:
    if(fk_equipments){
      if(fk_equipments.length == 1){
        this.selectedEquipments.push(fk_equipments[0]);
      } else {
        this.selectedEquipments = fk_equipments;
      }
    } else {
      //Enable equipments input:
      this.form.controls['fk_equipment'].disable();

      //Clear input:
      this.form.controls['fk_equipment'].setValue([]);

      //Send message:
      this.sharedFunctions.sendMessage('Advertencia: El servicio seleccionado NO tiene asignado ningún equipo.');
    }

  }

  onChangeService(): void {
    //Check selected equipments:
    if(this.selectedEquipments.length != 0){
      //Initialize params:
      let paramsEquipments = {};

      //Check number of selected equiipments:
      if(this.selectedEquipments.length == 1){
        paramsEquipments = {
          'filter[_id]' : this.selectedEquipments[0]
        };
      } else {
        paramsEquipments = {
          'filter[and][status]': true,
          'filter[and][fk_branch]': this.selectedBranch,
          'filter[in][_id]' : this.selectedEquipments
        };
      }

      //Set available equipments:
      this.sharedFunctions.find('equipments', paramsEquipments, (resEquipments) => {
        //Check data:
        if(resEquipments.data.length > 0){
          this.availableEquipments = resEquipments.data;

          //Enable equipments input:
          this.form.controls['fk_equipment'].enable();
        }
      });
    }
  }

  onSubmit(){
    //Validate fields:
    if(this.form.valid){

      //Check that the days are not all false:
      if(this.form.value.day.includes(true)){
        //Data normalization - Domain:
        const domain = this.form.value.domain.split('.');
        this.form.value.domain = {
          organization  : domain[0],
          branch        : domain[1],
          service       : domain[2]
        }

        //Data normalization - Booleans types (mat-option cases):
        if(typeof this.form.value.urgency != "boolean"){ this.form.value.urgency = this.form.value.urgency.toLowerCase() == 'true' ? true : false; }

        //Data normalization - Dates types:
        this.form.value.range_start = this.sharedFunctions.setDatetimeFormat(this.form.value.range_start);
        this.form.value.range_end = this.sharedFunctions.setDatetimeFormat(this.form.value.range_end);

        //Save data:
        //Create observable obsSave:
        const obsSave = this.apiClient.sendRequest('POST', 'slots/batch/insert', this.form.value);

        //Observe content (Subscribe):
        obsSave.subscribe({
          next: res => {
            this.sharedFunctions.response = res;

            //Response the form according to the result:
            this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
          },
          error: res => {
            //Send snakbar message:
            if(res.error.message){
              //Check validate errors:
              if(res.error.validate_errors){
                this.sharedFunctions.sendMessage(res.error.message + ' ' + res.error.validate_errors);
              } else {
                //Send other errors:
                this.sharedFunctions.sendMessage(res.error.message);
              }
            } else {
              this.sharedFunctions.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
            }
          }
        });
      } else {
        this.sharedFunctions.sendMessage('Debe seleccionar al menos un día de la semana para poder aplicar el rango de fechas.')
      }
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  findReferences(){
    //Initialize params:
    let params: any = { 'filter[status]': true };

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
