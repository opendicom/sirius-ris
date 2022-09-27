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

  //Initialize selected modalities array:
  private selectedModalities: string[] = [];
  private selectedEquipments: any = {};

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
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de servicios',
      content_icon  : 'health_and_safety',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('services');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      fk_branch       : [ '', [Validators.required] ],
      name            : [ '', [Validators.required] ],
      fk_equipments   : new FormControl({ value: '', disabled: true }, Validators.required),
      fk_modality     : new FormControl({ value: '', disabled: true }, Validators.required),
      status          : [ 'true' ]
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
            //Find references (disabled inputs):
            this.onChangeBranch(false, res.data[0]);

            //Send data to the form:
            this.setReactiveForm({
              fk_branch       : res.data[0].fk_branch,
              fk_modality     : res.data[0].fk_modality,
              name            : res.data[0].name,
              fk_equipments   : new FormControl({ value: [] }, Validators.required),
              status          : [ `${res.data[0].status}` ] //Use back tip notation to convert string
            });

            //Send data to FormControl elements (Arrays - Mat-Select Multiple):
            this.form.controls['fk_equipments'].setValue(res.data[0].fk_equipments);

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

    //Check update data case:
    if(updateData == false){
      fk_branch = event.value;
    } else {
      fk_branch = updateData.fk_branch;
    }

    //Find equipments for selected branch:
    const paramsEquipments = {
      'filter[status]': true,
      'filter[fk_branch]': fk_branch
    };

    //Set available equipments:
    this.sharedFunctions.find('equipments', paramsEquipments, (resEquipments) => {
      //Check data:
      if(resEquipments.data){
        //Set available equipments:
        this.availableEquipments = resEquipments.data;

        //Enable equipments input:
        this.form.controls['fk_equipments'].enable();

        //Find modalities (only in update case):
        if(updateData){
          this.findModalities(updateData);
        }
      }
    });
  }

  async addModalities(selected: any, equipment:string, modalities: string[]) {
    //Check if option is selected or unselected:
    if(selected){
      //Add selected equipment:
      this.selectedEquipments[equipment] = modalities;
    } else {
      //Remove unselected equipment:
      delete this.selectedEquipments[equipment];
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

  onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Data normalization - Booleans types (mat-option cases):
      if(typeof this.form.value.status != "boolean"){ this.form.value.status = this.form.value.status.toLowerCase() == 'true' ? true : false; }

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
  }

  //Find modalities only update case:
  async findModalities(updateData: any){
    //Loop into selected equipments:
    await Promise.all(Object.keys(this.availableEquipments).map((key) => {
      //Check if selected equipments (update data) is included in available equipments:
      if(updateData.fk_equipments.includes(this.availableEquipments[key]._id)){

        //Merge the below arrays and remove duplicates in the resulting array
        this.selectedModalities = this.selectedModalities.concat(this.availableEquipments[key].fk_modalities.filter((item: any) => this.selectedModalities.indexOf(item) < 0));
      }
    }));

    //Find modalities with "selectedModalities" and enable input:
    this.onChangeEquipment();
  }
}
