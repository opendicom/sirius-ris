import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { ReportsService } from '@modules/reports/services/reports.service';                 // Reports Services
import { PdfService } from '@shared/services/pdf.service';                                  // PDF Service
import { FileManagerService } from '@shared/services/file-manager.service';                 // File manager service
import {                                                                                    // Enviroments
  ISO_3166, 
  document_types, 
  gender_types, 
  privateHealthLang,
  cancellation_reasons,
  performing_flow_states
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
  public country_codes                  : any = ISO_3166;
  public document_types                 : any = document_types;
  public gender_types                   : any = gender_types;
  public privateHealthLang              : any = privateHealthLang;
  public performing_flow_states         : any = performing_flow_states;
  public cancellation_reasons           : any = cancellation_reasons;

  //Set references objects:
  public availableFS                    : any = {};
  public availablePathologies           : any[] = [];
  public filteredPathologies            : any[] = [];
  public selectedPathologies            : any[] = [];

  //Create CKEditor component and configure them:
  public clinicalInfoEditor             = customBuildEditor;
  public procedureDescriptionEditor     = customBuildEditor;
  public procedure_findingsEditor       = customBuildEditor;
  public summaryEditor                  = customBuildEditor;

  //Create CKEditor validators:
  public clinicalInfoValidator          : boolean = true;
  public procedureDescriptionValidator  : boolean = true;

  //Initializate validation tab errors:
  public reportTabErrors                : boolean = false;

  //Initializate requestedDICOMController:
  public requestedDICOMController       : boolean = false;
  public ohifPath                       : string = '';

  //Initializate data objects:
  public performingData                 : any = {};
  public performingFormattedDate        : any = {};
  public reportData                     : any = {};
  public amendmentsData                 : any = false;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public _id              : string = '';
  private keysWithValues  : Array<string> = [];
  public form_action      : any;
  public fk_performing    : string = '';
  public tabIndex         : number = 0;

  //Initializate all are false objects:
  public privatehealthAllAreFalse   : boolean = true;
  public implantsAllAreFalse        : boolean = true;

  //Initialize previous:
  public previous : any = undefined;

  //Set visible columns of the previous list:
  public displayedColumns: string[] = [
    'current',
    'flow_state',
    'date',
    'checkin_time',
    'patient_age',
    'details',
    'domain'
  ];

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
    public reportsService   : ReportsService,
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
      clinical_info           : ['', [Validators.required]],
      procedure_description   : ['', [Validators.required]],
      summary                 : [''],
      findings_title          : [''],
      procedure_findings      : [''],
      pathologies_input       : ['']
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];
    this.fk_performing = this.objRoute.snapshot.params['_id'];  // In reports form "action _id = fk_performing"

    //Enable source editing CKEditor for Superuser:
    if(this.sharedProp.userLogged.permissions[0].role == 1){
      //Add sourceEditing to the toolbar:
      if(!this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.includes('sourceEditing')){ this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.push('sourceEditing'); }
    }
    
    //Set tabIndex with parameters by routing (if exist):
    if(this.objRoute.snapshot.params['tabIndex'] !== null && this.objRoute.snapshot.params['tabIndex'] !== undefined && !isNaN(this.objRoute.snapshot.params['tabIndex'])){
      this.tabIndex = this.objRoute.snapshot.params['tabIndex'];
    }

    //Switch by form action:
    switch(this.form_action){
      case 'insert':
        //Find and set performing data:
        this.setPerformingData(this.fk_performing, (performingRes) => {
          //Find references (pathologies):
          this.findPathologies(performingRes.data[0].appointment.imaging.organization._id);
        });
        break;

      case 'update':
        //Set params:
        const params = {
          'filter[fk_performing]'         : this.fk_performing,

          //Project only report content, not performing content (multiple reports | amendments):
          'proj[clinical_info]'           : 1,
          'proj[procedure_description]'   : 1,
          'proj[findings]'                : 1,
          'proj[summary]'                 : 1,
          'proj[medical_signatures]'      : 1,
          'proj[authenticated.datetime]'  : 1,
          'proj[authenticated.user]'      : 1,
          'proj[pathologies]'             : 1,
          'proj[createdAt]'               : 1,

          //Project performing flow_state (Required to preview PDF report):
          'proj[performing.flow_state]'   : 1,

          //Make sure the first report is the most recent:
          'sort[createdAt]'               : -1
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

            //Set report _id:
            this._id = this.reportData._id;

            //Set needed information to set procedure_description with template:
            //this.procedure_template = this.reportData.procedure.procedure_template;
            //this.injection = this.reportData.performing.injection;

            //Find and set performing data:
            await this.setPerformingData(this.fk_performing, (performingRes) => {
              //Find references (pathologies):
              this.findPathologies(performingRes.data[0].appointment.imaging.organization._id);

              //Prevent undefined error on CKEditor fields:
              if(this.reportData.clinical_info == undefined ){ this.reportData.clinical_info = ''; }
              if(this.reportData.procedure_description == undefined ){ this.reportData.procedure_description = ''; }
              if(this.reportData.summary == undefined ){ this.reportData.summary = ''; }

              //Set findings object:
              let finding_title = '';
              let procedure_findings = '';

              //Prevent undefined error on CKEditor fields:
              if(this.reportData.findings == undefined || this.reportData.findings.length == 0 ){
                finding_title = 'Hallázgos de ' + this.performingData.procedure.name;
                procedure_findings = '';
              } else {
                finding_title = this.reportData.findings[0].title;
                procedure_findings = this.reportData.findings[0].procedure_findings;
              }

              //Send data to the form:
              this.setReactiveForm({
                clinical_info         : this.reportData.clinical_info,
                procedure_description : this.reportData.procedure_description,
                summary               : this.reportData.summary,

                //Force the use of the first finding (current procedure finding), extra_procedures will be added in the future.
                findings_title        : finding_title,
                procedure_findings    : procedure_findings,
                pathologies_input     : []
              });

              //Get property keys with values:
              this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);
            });

            //Initialize pathologies:
            this.initializeSelectedPathologies(this.reportData.pathologies);

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

  passwordRequest(current_operation: string){
    //Clear previous password:
    this.sharedFunctions.requested_password = '';

    //Open dialog to request user password:
    this.sharedFunctions.openDialog('password_request', {}, (result) => {
      //Check dialog result:
      if(result){
        this.onSubmit(current_operation);
      }
    });
  }
  
  async onSubmit(current_operation: string = 'save'){
    //Validate CKEditor clinical_info (min length 10 + 7 chars [<p></p>]):
    if(this.form.value.clinical_info.length < 17){
      this.clinicalInfoValidator = false;
    } else {
      this.clinicalInfoValidator = true;
    }

    //Validate CKEditor procedure_description (min length 10 + 7 chars [<p></p>]):
    if(this.form.value.procedure_description.length < 17){
      this.procedureDescriptionValidator = false;
    } else {
      this.procedureDescriptionValidator = true;
    }

    //Validate fields:
    if(this.form.valid){
      //Set reportTab errors false (single tab with form):
      this.reportTabErrors = false;

      //Create save object to preserve data types in form.value (Clone objects with spread operator):
      let reportSaveData = { ...this.form.value };

      //Data normalization - Findings object:
      if(reportSaveData.procedure_findings.length > 17){
        //Overwrite finding value format:
        reportSaveData['findings'] = [{
          fk_procedure        : this.performingData.procedure._id,
          title               : reportSaveData.findings_title,
          procedure_findings  : reportSaveData.procedure_findings
        }];
      //Update unset findings field case (empty CKEditor <= 7 chars '<p></p>'):
      } else if(reportSaveData.procedure_findings.length <= 7 && this.form_action == 'update'){
        reportSaveData['findings'] = '';  //Empty string to unset previous value.
      };

      //Set fk_performing in save object:
      reportSaveData['fk_performing'] = this.fk_performing;

      //Data normalization - Pathologies:
      if(this.selectedPathologies.length > 0){
        reportSaveData['fk_pathologies'] = [];
        //Add all selected pathologies into fk_pathologies array (await foreach):
        await Promise.all(Object.keys(this.selectedPathologies).map((key: any) =>{
          reportSaveData.fk_pathologies.push(this.selectedPathologies[key]._id);
        }));
      }

      //Delete temp values:
      delete reportSaveData.pathologies_input;
      delete reportSaveData.findings_title;
      delete reportSaveData.procedure_findings;

      //Add findings field if procedure_findings exist in keysWithValues:
      if(this.keysWithValues.find((str) => str === 'procedure_findings')){
        this.keysWithValues.push('findings');

        //Remove procedure_findings from keysWithValues:
        this.sharedFunctions.removeItemFromArray(this.keysWithValues, 'procedure_findings');
      };

      //Remove findings_title from keysWithValues:
      this.sharedFunctions.removeItemFromArray(this.keysWithValues, 'findings_title');

      //Save report data:
      this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, reportSaveData, this.keysWithValues, (resReportSave) => {
        //Switch by current operation:
        switch(current_operation){
          case 'save':
            //Response the form according to the result:
            this.sharedFunctions.formResponder(resReportSave, 'reports', this.router, false);

            //Reload a component:
            this.router.routeReuseStrategy.shouldReuseRoute = () => false;
            this.router.onSameUrlNavigation = 'reload';

            //Redirecto to this form (Set Tab 1 | Report form tab):
            this.router.navigate(['/reports/form/update/' + this.fk_performing + '/1']);
            break;
          
          case 'save-sign':
            //Check save report operation result:
            if(resReportSave.success === true){
              //Sign report (callback exec only on success):
              this.reportsService.sign(resReportSave.data._id, this.sharedFunctions.requested_password, () => {
                //Clear requested password:
                this.sharedFunctions.requested_password = '';

                //Redirect to performing list:
                this.router.navigate(['/performing/list']);
              });
            }
            break;

          case 'save-sign-authenticate':
            //Check save report operation result:
            if(resReportSave.success === true){
              //Sign and authenticate report (callback exec only on success):
              this.reportsService.sign(resReportSave.data._id, this.sharedFunctions.requested_password, () => {
                this.reportsService.authenticate(resReportSave.data._id, this.sharedFunctions.requested_password, () => {
                  //Clear requested password:
                  this.sharedFunctions.requested_password = '';

                  //Redirect to performing list:
                  this.router.navigate(['/performing/list']);
                });
              });
            }
            break;
        }
      });
    } else {
      //Set reportTab errors true (single tab with form):
      this.reportTabErrors = true;
    }
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

  async setPerformingData(fk_performing: string, callback = (res: any) => {}) {
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

          //Set current imaging (Required for file manager):
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

          //Set findings title (only insert cases):
          if(this.form_action == 'insert'){
            this.form.controls['findings_title'].setValue('Hallázgos de ' + this.performingData.procedure.name);
          }

          //Find previous:
          this.sharedFunctions.findPrevious(this.performingData.patient._id, (objPrevious => {
            this.previous = objPrevious;
          }));

          //Excecute optional callback with response:
          callback(performingRes);
        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage('Error al intentar insertar el elemento: ' + performingRes.message);
          this.router.navigate(['/performing/list']);
        }
      });
    }
  }

  filterPathologies(event: any){
    //Set filter value and to upper case:
    const filterValue = event.srcElement.value.toUpperCase();

    //Filter pathologies:
    this.filteredPathologies = this.availablePathologies.filter(option => option.name.toUpperCase().includes(filterValue));
  }

  addPathology(currentPathology: any){
    //Add current pathology into selected pathologies array (check duplicates):
    if(this.selectedPathologies.filter(element => element._id === currentPathology._id).length <= 0){
      this.selectedPathologies.push(currentPathology);
    }

    //Remove currentPathology from availablePathologies:
    this.sharedFunctions.removeItemFromArray(this.availablePathologies, currentPathology);

    //Clear pathologies input:
    this.form.controls['pathologies_input'].setValue('');
    
    //Clear filter pathologies:
    this.filterPathologies({ srcElement : { value: '' } });
  }

  removePathology(currentPathology: any){
    //Remove current Pathology from selected pathologies:
    this.sharedFunctions.removeItemFromArray(this.selectedPathologies, currentPathology);

    //Add removed pathology into availablePathologies and filteredPathologies (check duplicates):
    if(this.availablePathologies.filter(element => element._id === currentPathology._id).length <= 0){
      this.availablePathologies.push(currentPathology);
    }
    
    //Clear pathologies input:
    this.form.controls['pathologies_input'].setValue('');

    //Clear filter pathologies:
    this.filterPathologies({ srcElement : { value: '' } });
  }
  
  findPathologies(fk_organization: string){
    //Initialize params:
    let params: any;

    //Switch params:
    switch(this.objRoute.snapshot.params['action']){
      case 'insert':
        params = {
          'filter[fk_organization]': fk_organization,
          'filter[status]': true,
          'proj[name]': 1
        };
        break;

      case 'update':
        params = {
          'filter[fk_organization]': fk_organization,
          'proj[name]': 1
        };
        break;
    }

    //Find pathologies:
    this.sharedFunctions.find('pathologies', params, (res) => {
      this.availablePathologies = [... res.data];
      this.filteredPathologies = [... res.data];
    });
  }

  async initializeSelectedPathologies(pathologies:any){
    //Loop in pathologies aggregation result (await foreach):
    await Promise.all(Object.keys(pathologies).map((key: any) => {
      //Set current pathology:
      const currentPathology = { _id: pathologies[key]._id, name: pathologies[key].name };

      //Add into selected pathologies:
      this.selectedPathologies.push(currentPathology);
    }));
  }

  insertClinicalInfo(){
    //Initializate clinical template:
    let clinical_template = '';

    //Set patient age and genre:
    const patient_age = this.sharedFunctions.calculateAge(this.performingData.patient.person.birth_date, this.performingData.date);
    clinical_template += '<p>Edad: ' + patient_age + ', Sexo: ' + this.gender_types[this.performingData.patient.person.gender] + '</p>';

    //Set anamnesis if exist:
    if(this.performingData.appointment.anamnesis !== undefined && this.performingData.appointment.anamnesis !== null && this.performingData.appointment.anamnesis !== ''){
      clinical_template += this.performingData.appointment.anamnesis;
    }

    //Set indications if exist:
    if(this.performingData.appointment.indications !== undefined && this.performingData.appointment.indications !== null && this.performingData.appointment.indications !== ''){
      clinical_template += this.performingData.appointment.indications;
    }

    //Insert template on field:
    this.form.controls['clinical_info'].setValue(clinical_template);

    //Send message:
    this.sharedFunctions.sendMessage('Dato clínico cargado', { duration: 2000 });
  }

  insertProcedureTemplate(){
    //Initializate template:
    let procedure_template = this.performingData.procedure.procedure_template;

    //Check if the study has injection:
    if(this.performingData.injection !== undefined && this.performingData.injection !== null){
      //Check if it is a PET-CT study:
      if(this.performingData.injection.hasOwnProperty('pet_ct')){
        procedure_template = procedure_template.replace('[dosis_mbq]', this.performingData.injection.pet_ct.administred_activity);
        procedure_template = procedure_template.replace('[dosis_mci]', this.sharedFunctions.MBqTomCi(this.performingData.injection.pet_ct.administred_activity));
      }
    }

    //Insert template on field:
    this.form.controls['procedure_description'].setValue(procedure_template);

    //Send message:
    this.sharedFunctions.sendMessage('Plantilla de procedimiento cargada', { duration: 2000 });
  }

  insertReportTemplate(){
    //Initializate template:
    let report_template = this.performingData.procedure.report_template;

    //Insert template on field:
    this.form.controls['procedure_findings'].setValue(report_template);

    //Send message:
    this.sharedFunctions.sendMessage('Plantilla de informe cargada', { duration: 2000 });
  }

  getStudyDICOM(){
    //Check that the study has not been previously requested:
    if(this.requestedDICOMController === false){
      //Request DICOM image query path:
      this.sharedFunctions.wezenStudyToken(this.fk_performing, 'ohif', (wezenStudyTokenRes) => {
        if(wezenStudyTokenRes.success === true){
          //Set requestedDICOMController and ohifPath:
          this.requestedDICOMController = true;
          this.ohifPath = wezenStudyTokenRes.path;
        } else {
          //Send Console Warn Message:
          console.warn('Error al intentar buscar las imágenes DICOM del elemento: ' + wezenStudyTokenRes.message);
        }
      });
    }
  }

  onTabChange(event: any){
    //Refresh tabIndex:
    this.tabIndex = event.index;

    //Get path for retrieve DICOM images:
    if(event.index == 2){
      this.getStudyDICOM();
    }
  }
}
