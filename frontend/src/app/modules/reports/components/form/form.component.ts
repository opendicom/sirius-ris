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
  public findingsValidator              : boolean = true;
  public summaryValidator               : boolean = true;

  //Initializate data objects:
  public performingData           : any = {};
  public performingFormattedDate  : any = {};
  public reportData               : any = {};
  public amendmentsData           : any = false;

  //Initializate performing local current flow state:
  public current_flow_state           : string = 'R01';

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public _id              : string = '';
  private keysWithValues  : Array<string> = [];
  public form_action      : any;
  public fk_performing    : string = '';

  //Initializate all are false objects:
  public privatehealthAllAreFalse   : boolean = true;
  public implantsAllAreFalse        : boolean = true;

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
      summary                 : ['', [Validators.required]],
      findings_title          : ['', [Validators.required]],
      findings                : ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];
    this.fk_performing = this.objRoute.snapshot.params['_id'];  // In reports form "action _id = fk_performing"

    //Switch by form action:
    switch(this.form_action){
      case 'insert':
        //Find and set performing data:
        this.setPerformingData(this.fk_performing);
        break;

      case 'update':
        //Set params:
        const params = {
          'filter[fk_performing]'       : this.fk_performing,

          //Project only report content, not performing content (multiple reports | amendments):
          'proj[clinical_info]'         : 1,
          'proj[procedure_description]' : 1,
          'proj[findings]'              : 1,
          'proj[summary]'               : 1,
          'proj[medical_signatures]'    : 1,
          'proj[authenticated]'         : 1,
          'proj[pathologies]'           : 1,
          'proj[createdAt]'             : 1,

          //Make sure the first report is the most recent:
          'sort[createdAt]'             : -1
        };

        //Find reports by fk_performing:
        this.sharedFunctions.find('reports', params, async (reportsRes) => {
          //Check operation status:
          if(reportsRes.success === true){
            //Check amend cases:
            if(this.sharedFunctions.getKeys(reportsRes.data, false, true).length > 1){
              //Set history report data object (Clone objects with spread operator):
              this.amendmentsData = [... reportsRes.data];

              //Delete current report from the history (first element):
              this.amendmentsData.shift();
            }

            //Set report data with the last report (amend cases):
            this.reportData = reportsRes.data[0];

            //Find and set performing data:
            this.setPerformingData(this.fk_performing);

            //Send data to the form:
            this.setReactiveForm({
              clinical_info         : this.reportData.clinical_info,
              procedure_description : this.reportData.procedure_description,
              summary               : this.reportData.summary,

              //Force the use of the first finding (current procedure finding), extra_procedures will be added in the future.
              findings_title        : this.reportData.findings[0].title,
              findings              : this.reportData.findings[0].procedure_findings
            });

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage('Error al intentar insertar el elemento: ' + reportsRes.message);
            this.router.navigate(['/performing/list']);
          }
        });

        break;

      default:
        //Return to the list with request error message:
        this.sharedFunctions.sendMessage('Error al intentar editar el elemento: La acción indicada sobre el formulario es incorrecta [insert | update].');
  
        //Redirect to the list:
        this.sharedFunctions.gotoList('performing', this.router);
        break;
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

  async checkPrivateHealth(obj: any) {
    //Initializate result:
    let result = true;

    //Search true values in object | keyvalue (await foreach)::
    await Promise.all(Object.keys(obj).map(key => {
      if (typeof obj[key] == 'boolean' && obj[key] !== false) {
        result = false;
      }
    }));

    //Return result:
    return result;
  }

  async checkImplants(obj: any) {
    //Initializate result:
    let result = true;

    //Search true values in object | keyvalue (await foreach)::
    await Promise.all(Object.keys(obj).map(key => {
      if(obj[key] !== false && obj[key] !== 'No'){
        result = false;
      }
    }));

    //Return result:
    return result;
  }

  async setPerformingData(fk_performing: string) {
    //Check if element is not empty:
    if(fk_performing != ''){
      //Set params:
      const params = { 'filter[_id]': fk_performing };

      //Find referenced performing:
      this.sharedFunctions.find('performing', params, async (performingRes) => {
        //Check operation status:
        if(performingRes.success === true){
          //Set performing data:
          this.performingData = performingRes.data[0];
          this.performingFormattedDate = await this.sharedFunctions.datetimeFulCalendarFormater(new Date(this.performingData.date), new Date(this.performingData.date));

          //Set current imaging (Necesario para file manager):
          this.sharedProp.current_imaging = this.performingData.appointment.imaging;

          //Add files into file manager controller:
          if(this.performingData.appointment.attached_files.length > 0){
            Promise.all(Object.keys(this.performingData.appointment.attached_files).map((key) => {
              this.fileManager.controller['attached_files'].files[this.performingData.appointment.attached_files[key]._id] = this.performingData.appointment.attached_files[key].name;
            }));
          }

          //Set all are false or not object values:
          this.privatehealthAllAreFalse = await this.checkPrivateHealth(this.performingData.appointment.private_health);
          this.implantsAllAreFalse = await this.checkImplants(this.performingData.appointment.private_health.implants);

          //Get property keys with values:
          this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage('Error al intentar insertar el elemento: ' + performingRes.message);
          this.router.navigate(['/performing/list']);
        }
      });
    }
  }
}
