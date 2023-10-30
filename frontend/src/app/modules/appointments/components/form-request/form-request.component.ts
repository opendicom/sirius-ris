import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import {                                                                                // Enviroments
  ISO_3166, 
  document_types, 
  gender_types, 
  appointment_requests_flow_states
} from '@env/environment';
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';           // CKEditor
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form-request',
  templateUrl: './form-request.component.html',
  styleUrls: ['./form-request.component.css']
})
export class FormRequestComponent implements OnInit {
  //Set component properties:
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public gender_types           : any = gender_types;
  public availableFS            : any = appointment_requests_flow_states;

  //Create CKEditor component and configure them:
  public annotationsEditor = customBuildEditor;

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
    public formBuilder      : FormBuilder,
    private router          : Router,
    private objRoute        : ActivatedRoute,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de solicitudes',
      content_icon  : 'move_to_inbox',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('appointment_requests');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      flow_state:   ['AR01', [Validators.required]],
      annotations:  ['']
    });
  }

  ngOnInit(): void {
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
          //Prevent undefined error on CKEditor fields:
          if(res.data[0].annotations == undefined ){ res.data[0].annotations = ''; }

          //Send data to the form:
          this.setReactiveForm({
            flow_state  : res.data[0].flow_state,
            annotations : res.data[0].annotations
          });

          //Set out-of-edition flow states:
          if(res.data[0].flow_state == 'AR05' || res.data[0].flow_state == 'AR06'){
            this.form.controls['flow_state'].disable();
          }

          //Get property keys with values:
          this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + res.message);
          this.router.navigate(['/appointments/list_requests']);
        }
      });
    }

    //Enable source editing CKEditor for Superuser:
    if(this.sharedProp.userLogged.permissions[0].role == 1){
      //Add sourceEditing to the toolbar:
      if(!this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.includes('sourceEditing')){ this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.push('sourceEditing'); }
    }
  }

  onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Update data:
      this.sharedFunctions.save('update', this.sharedProp.element, this._id, this.form.value, this.keysWithValues, (res) => {
        //Response the form according to the result:
        this.sharedFunctions.formResponder(res, '/appointments/list_requests', this.router, false);
      });
    }
  }

  onCancel(){
    //Redirect to the list:
    this.router.navigate(['/appointments/list_requests']);
  }
}
