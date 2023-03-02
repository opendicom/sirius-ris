import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  app_setting, 
  ISO_3166, 
  document_types, 
  gender_types, 
  reports_flow_states,
  CKEditorConfig
} from '@env/environment';
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';               // CKEditor
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  //Set component properties:
  public settings             : any = app_setting;
  public country_codes        : any = ISO_3166;
  public document_types       : any = document_types;
  public gender_types         : any = gender_types;
  public reportsFS            : any = reports_flow_states;

  //Create CKEditor component and configure them:
  public clinicalInfoEditor         = customBuildEditor;
  public procedureDescriptionEditor = customBuildEditor;
  public findingsEditor             = customBuildEditor;
  public summaryEditor              = customBuildEditor;
  public editorConfig               = CKEditorConfig;

  //Create CKEditor validators:
  public clinicalInfoValidator          : boolean = true;
  public procedureDescriptionValidator  : boolean = true;
  public summaryValidator               : boolean = true;

  //Initializate performing data:
  public performingData           : any = {};
  public performingFormattedDate  : any = {};

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public _id              : string = '';
  private keysWithValues  : Array<string> = [];
  public form_action      : any;
  public fk_performing    : string = '';

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
    private sharedFunctions : SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Edición de informe',
      content_icon  : 'edit_note',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('reports');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      clinical_info           : ['', [Validators.required]],
      procedure_description   : ['', [Validators.required]],
      summary                 : ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];

    //Extract sent data (Parameters by routing) | In reports action _id = fk_performing:
    this.fk_performing = this.objRoute.snapshot.params['_id'];

    //Check if element is not empty:
    if(this.fk_performing != ''){
      //Request params:
      const params = { 'filter[_id]': this.fk_performing };

      //Find element to update:
      this.sharedFunctions.find('performing', params, async (performingRes) => {
        //Check operation status:
        if(performingRes.success === true){
          //Set performing data:
          this.performingData = performingRes.data[0];
          this.performingFormattedDate = await this.sharedFunctions.datetimeFulCalendarFormater(new Date(this.performingData.date), new Date(this.performingData.date));
          
          //Find report by _id (update case):
          //Send data to the form:
          /*
          this.setReactiveForm({
            clinical_info         : res.data[0].clinical_info,
            procedure_description : res.data[0].procedure_description,
            summary               : res.data[0].summary
          });
          */

          //Get property keys with values:
          this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage('Error al intentar insertar el elemento: ' + performingRes.message);
          this.router.navigate(['/' + this.sharedProp.element + '/list']);
        }
      });
    }
  }

  onSubmit(){
    //Validate CKEditor anesthesia (min length 10 + 7 chars [<p></p>]):
    if(this.form.value.anesthesia.procedure.length < 17){
      this.clinicalInfoValidator = false;
    } else {
      this.clinicalInfoValidator = true;
    }

    //Validate fields:
    if(this.form.valid){
      //Test:
      console.log(this.form.value);

      //Data normalization:
      //Save report data:
      //If Report is finished -> Update performing flow state.
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

}
