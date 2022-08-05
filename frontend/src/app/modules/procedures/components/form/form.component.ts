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
  public availableModalities: any;
  public availableEquipments: any;

  //Initialize selected objects:
  private selectedModalities: string[] = [];
  public selectedEquipments: any = {};
  public selectedDurations: any = {};

  //Re-define method in component to use in HTML view:
  public getKeys: any;

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
    //Find references:
    this.findReferences();

    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de procedimientos',
      content_icon  : 'format_list_numbered',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('procedures');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      domain          : [ '', [Validators.required] ],
      name            : [ '', [Validators.required] ],
      equipments      : new FormControl({ value: '', disabled: true }, Validators.required),
      fk_modality     : new FormControl({ value: '', disabled: true }, Validators.required),
      status          : [ 'true' ],
      preparation     : [ '', [Validators.required] ]
    });
  }

  ngOnInit(): void {
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
            //Find references (disabled inputs):
            this.onChangeBranch(false, res.data[0]);

            //Send data to the form:
            this.setReactiveForm({
              domain          : res.data[0].domain.organization + '.' + res.data[0].domain.branch,
              fk_modality     : res.data[0].fk_modality,
              name            : res.data[0].name,
              equipments      : new FormControl({ value: [] }, Validators.required),
              status          : [ `${res.data[0].status}` ], //Use back tip notation to convert string
              preparation     : res.data[0].preparation
            });

            //Set empty array value to prevent "Value must be an array in multiple-selection mode":
            this.form.controls['equipments'].setValue([]);

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

  onChangeBranch(event: any, updateData: any = false): void {
    //Initialize fk_branch:
    let fk_branch = '';

    //Reset selected equipments and durations:
    this.selectedEquipments = {};
    this.selectedDurations = {};

    //Check update data case:
    if(updateData == false){
      fk_branch = event.value.split('.')[1];
    } else {
      fk_branch = updateData.domain.branch;
    }

    //Find equipments for selected branch:
    const paramsEquipments = {
      'filter[status]': true,
      'filter[fk_branch]': fk_branch
    };

    //Set available equipments:
    this.sharedFunctions.find('equipments', paramsEquipments, async (resEquipments) => {
      //Check data:
      if(resEquipments.data){
        //Set available equipments:
        this.availableEquipments = resEquipments.data;

        //Enable equipments input:
        this.form.controls['equipments'].enable();

        //Set equipments info (only in update case):
        if(updateData){
          await this.setEquipments(updateData);
        }
      }
    });
  }

  async addModalities(selected: any, equipment: string, modalities: string[]) {
    //Check if option is selected or unselected:
    if(selected){
      //Add selected equipment:
      this.selectedEquipments[equipment] = modalities;

      //Loop into available equipments (await foreach):
      await Promise.all(Object.keys(this.availableEquipments).map((key) => {
        //Check equipment _id:
        if(this.availableEquipments[key]._id == equipment){
          //Add equipment in selected duration and initialize duration value:
          this.selectedDurations[equipment] = {
            name: this.availableEquipments[key].name,
            duration: ''
          };
        }
      }));

    } else {
      //Remove unselected equipment:
      delete this.selectedEquipments[equipment];

      //Remove unselected equipment duration:
      delete this.selectedDurations[equipment];
    }

    //Clear selected modalities array:
    this.selectedModalities = [];

    //Loop into selected equipments (await foreach):
    await Promise.all(Object.keys(this.selectedEquipments).map((key) => {
      //Merge the below arrays and remove duplicates in the resulting array
      this.selectedModalities = this.selectedModalities.concat(this.selectedEquipments[key].filter((item: any) => this.selectedModalities.indexOf(item) < 0));
    }));
  }

  onChangeEquipment(): void {
    //Check selected modalities:
    if(this.selectedModalities.length > 0){
      //Find corresponding modalities:
      const paramsModalities = {
        'filter[in][_id]' : this.selectedModalities
      }

      //Find modalities:
      this.sharedFunctions.find('modalities', paramsModalities, (resModalities) => {
        //Check data:
        if(resModalities.data){
          //Set available modalities:
          this.availableModalities = resModalities.data;

          //Enable modality input:
          this.form.controls['fk_modality'].enable();
        }
      });
    }
  }

  async onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Data normalization - Domain:
      const domain = this.form.value.domain.split('.');
      this.form.value.domain = {
        organization  : domain[0],
        branch        : domain[1]
      }

      //Data normalization - Booleans types:
      if(typeof this.form.value.status != "boolean"){ this.form.value.status = this.form.value.status.toLowerCase() == 'true' ? true : false; }

      //Data normalization - Equipments array of objects:
      this.form.value.equipments = []; //Reset array of objects equipments (Ignore previous content - Form control only).
      await Promise.all(Object.keys(this.selectedDurations).map((current, index) => {
        this.form.value.equipments[index] = {
          fk_equipment: current,
          duration: this.selectedDurations[current].duration
        };
      }));

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

    //Find modalities (Only update action - first case):
    if(this.objRoute.snapshot.params['action'] == 'update'){
      this.sharedFunctions.find('modalities', params, (res) => {
        this.availableModalities = res.data;
      });
    }
  }

  async setEquipments(updateData: any){
    //Create array to set data into equipments input FormControl (Arrays - Mat-Select Multiple):
    let equipmentsIds: string[] = [];

    //Loop (await foreach):
    await Promise.all(Object.keys(this.availableEquipments).map(async (availableEquipmentKey) => {
      await Promise.all(Object.keys(updateData.equipments).map((updateDataEquipmentKey) => {

        //Check if update data equipments in available equipments:
        if(updateData.equipments[updateDataEquipmentKey].fk_equipment == this.availableEquipments[availableEquipmentKey]._id){
          //Set selected equipments:
          this.selectedEquipments[this.availableEquipments[availableEquipmentKey]._id] = this.availableEquipments[availableEquipmentKey].fk_modalities;

          //Set selected durations:
          this.selectedDurations[this.availableEquipments[availableEquipmentKey]._id] = {
            name: this.availableEquipments[availableEquipmentKey].name,
            duration: updateData.equipments[updateDataEquipmentKey].duration
          };

          //Add current equipment _id into equipmentsIds:
          equipmentsIds.push(this.availableEquipments[availableEquipmentKey]._id);
        }
      }));
    }));

    //Send data to FormControl elements (Arrays - Mat-Select Multiple):
    this.form.controls['equipments'].setValue(equipmentsIds);
  }
}
