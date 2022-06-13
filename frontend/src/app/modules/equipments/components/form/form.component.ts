import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
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

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de equipamiento',
      content_icon  : 'precision_manufacturing',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('equipments');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      fk_branch     : ['', [Validators.required]],
      fk_modalities : [[], [Validators.required]],
      name          : ['', [Validators.required]],
      serial_number : [''],
      AET           : [''],
      status        : ['true']
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
            //Send data to the form:
            this.setReactiveForm({
              fk_branch     : res.data[0].fk_branch,
              fk_modalities : [], //res.data[0].fk_modalities,
              name          : res.data[0].name,
              serial_number : res.data[0].serial_number,
              AET           : res.data[0].AET,
              status        : [ `${res.data[0].status}` ] //Use back tip notation to convert string
            });

            console.log(res.data[0].fk_modalities);
            console.log(this.form.value.fk_modalities);

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

  onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Data normalization - Booleans types:
      this.form.value.status = this.form.value.status.toLowerCase() == 'true' ? true : false;

      //TEST:
      console.log(this.form.value);

      //Save data:
      /*
      this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, this.form.value, this.keysWithValues, (res) => {
        //Response the form according to the result:
        this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
      });
      */
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
      //NgFor only supports binding to Iterables such as Arrays (RABC procesed condition):
      if(Array.isArray(res.data)){
        this.availableOrganizations = res.data;
      } else {
        this.availableOrganizations = [res.data];
      }
    });

    //Find branches:
    this.sharedFunctions.find('branches', params, (res) => {
      //NgFor only supports binding to Iterables such as Arrays (RABC procesed condition):
      if(Array.isArray(res.data)){
        this.availableBranches = res.data;
      } else {
        this.availableBranches = [res.data];
      }
    });

    //Find modalities:
    this.sharedFunctions.find('modalities', params, (res) => {
      this.availableModalities = res.data;
    });
  }

}
