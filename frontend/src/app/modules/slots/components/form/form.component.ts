import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';       // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
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

  //Inject services, components and router to the constructor:
  constructor(
    public formBuilder: FormBuilder,
    private router: Router,
    private objRoute: ActivatedRoute,
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService
  ){
    //Set min and max dates (Datepicker):
    const dateRangeLimit = this.sharedFunctions.setDateRangeLimit(new Date()); //Today
    this.minDate = dateRangeLimit.minDate;
    this.maxDate = dateRangeLimit.maxDate;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de turnos',
      content_icon  : 'date_range',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('slots');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      domain            : ['', [Validators.required]],
      fk_equipment      : new FormControl({ value: '', disabled: true }, Validators.required),
      date              : ['', [Validators.required]],
      start             : ['', [Validators.required]],
      end               : ['', [Validators.required]],
      urgency           : ['false']
    });
  }

  ngOnInit(): void {
    //Find references:
    this.findReferences();

    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];

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
            //Format time values:
            let start = JSON.stringify(res.data[0].start).split('T')[1].split('.')[0].slice(0, -3);
            let end = JSON.stringify(res.data[0].end).split('T')[1].split('.')[0].slice(0, -3);

            //Send data to the form:
            this.setReactiveForm({
              domain          : new FormControl({ value: '' }, Validators.required),
              fk_equipment    : new FormControl({ value: '', disabled: false }, Validators.required),
              date            : new Date(res.data[0].start),
              start           : start,
              end             : end,
              urgency         : [ `${res.data[0].urgency}` ] //Use back tip notation to convert string
            });

            //Send data to FormControl elements:
            this.form.controls['domain'].setValue(res.data[0].domain.organization + '.' + res.data[0].domain.branch + '.' + res.data[0].domain.service);
            this.setBranch(res.data[0].branch._id, res.data[0].service.fk_equipments);  //Necessary to obtain information for fk_equipment input.
            this.onChangeService();                                                     //Necessary to obtain information for fk_equipment input.
            this.form.controls['fk_equipment'].setValue(res.data[0].fk_equipment);

            //Get property keys with values:
            this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + res.message);
            this.router.navigate(['/' + this.sharedProp.element + '/list']);
          }
        });
      }
    }
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
      //Disable equipments input:
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
      this.form.value.start = this.sharedFunctions.setDatetimeFormat(this.form.value.date, this.form.value.start);
      this.form.value.end = this.sharedFunctions.setDatetimeFormat(this.form.value.date, this.form.value.end);

      //Delete temp fields:
      delete this.form.value.date;

      //Save data:
      this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, this.form.value, this.keysWithValues, (res) => {
        //Response the form according to the result:
        this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
      });
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  findReferences(){
    //Initialize params:
    let params: any;

    //Switch params:
    switch(this.objRoute.snapshot.params['action']){
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

    //Find services:
    this.sharedFunctions.find('services', params, (res) => {
      this.availableServices = res.data;
    });
  }
}
