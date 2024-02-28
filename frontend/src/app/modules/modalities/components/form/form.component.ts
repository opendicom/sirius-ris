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
    public formBuilder        : FormBuilder,
    private router            : Router,
    private objRoute          : ActivatedRoute,
    public sharedProp         : SharedPropertiesService,
    private sharedFunctions   : SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de modalidades',
      content_icon  : 'multiple_stop',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('modalities');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      code_meaning: ['', [Validators.required]],
      code_value:   ['', [Validators.required]],
      status:       ['true'],
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
              code_meaning: res.data[0].code_meaning,
              code_value: res.data[0].code_value,
              status: [ `${res.data[0].status}` ] //Use back tip notation to convert string
            });

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

}
