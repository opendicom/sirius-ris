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
              code_meaning: res.data.code_meaning,
              code_value: res.data.code_value,
              status: [ `${res.data.status}` ] //Use back tip notation to convert string
            });
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

      //Validate data - Delete empty fields:
      this.sharedFunctions.cleanEmptyFields(this.form.value);

      //Add _id only for update case:
      if(this.form_action == 'update' && this._id != ''){
        this.form.value._id = this._id;
      }

      //Save data:
      this.sharedFunctions.save(this.sharedProp.element, this.form_action,  this.form.value, (res) => {
        //Check operation status:
        if(res.success === true){
          //Send snakbar message:
          this.sharedFunctions.sendMessage('¡Guardado existoso!');

          //Redirect to the list:
          this.onCancel();

        } else {
          //Send snakbar message:
          this.sharedFunctions.sendMessage(res.message);
        }
      });
    }
  }

  onCancel(){
    //Reset response data before redirect to the list:
    this.sharedFunctions.response = {};

    //Redirect to list element:
    this.router.navigate(['/' + this.sharedProp.element + '/list']);
  }

}
