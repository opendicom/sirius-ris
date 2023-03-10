import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { PdfService } from '@shared/services/pdf.service';                                  // PDF Service
import { FileManagerService } from '@shared/services/file-manager.service';                 // File manager service
import {                                                                                    // Enviroments
  app_setting, 
  ISO_3166, 
  document_types, 
  gender_types, 
  reports_flow_states,
  privateHealthLang,
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
  public settings               : any = app_setting;
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public gender_types           : any = gender_types;
  public reportsFS              : any = reports_flow_states;
  public privateHealthLang      : any = privateHealthLang;

  //Initializate available flow states:
  public availableFS          : any = {};

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

  //Initializate performing local current flow state:
  public current_flow_state           : string = 'R01';

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public _id              : string = '';
  private keysWithValues  : Array<string> = [];
  public form_action      : any;
  public fk_performing    : string = '';

  //Re-define method in component to use in HTML view:
  public getKeys: any;

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
    public sharedFunctions  : SharedFunctionsService,
    public fileManager      : FileManagerService,
    public pdfService       : PdfService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Initialize selected file objects:
    this.fileManager.uploadProgress = 0;
    this.fileManager.controller = {
      informed_consent  : {
        files: {},
        disabled: false
      },
      clinical_trial    : {
        files: {},
        disabled: false
      },
      attached_files    : {
        files: {},
        disabled: false
      }
    };

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
      flow_state              : [ this.current_flow_state, [Validators.required]],
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
          
          //Set available flow states:
          this.setAvailableFlowStates('R01');

          //Set flow state (first time | enable validators):
          this.setFlowState('R01');

          //Add files into file manager controller:
          if(this.performingData.appointment.attached_files.length > 0){
            Promise.all(Object.keys(this.performingData.appointment.attached_files).map((key) => {
              this.fileManager.controller['attached_files'].files[this.performingData.appointment.attached_files[key]._id] = this.performingData.appointment.attached_files[key].name;
            }));
          }
          
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

  async setAvailableFlowStates(currentFS: string){
    //Initialize found flag:
    let foundFlag = false;

    //Loop in enviroment flow states list (await foreach):
    await Promise.all(Object.keys(this.reportsFS).map((key) => {
      //Check that currentFS is equal to key or that currentFS has already been entered/found:
      if(currentFS === key || foundFlag){
        //Add current flow state into available flow states:
        this.availableFS[key] = this.reportsFS[key];

        //Set found flag as true:
        foundFlag= true;
      }
    }));
  }

  setFlowState(flow_state: any){
    //Set current flow state:
    this.current_flow_state = flow_state.toString();
  }
}
