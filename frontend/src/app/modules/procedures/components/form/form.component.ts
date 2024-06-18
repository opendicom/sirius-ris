import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';       // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';           // CKEditor
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  //Create CKEditor component and configure them:
  public preparationEditor        = customBuildEditor;
  public procedureTemplateEditor  = customBuildEditor;
  public reportTemplateEditor     = customBuildEditor;

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableModalities    : any;
  public availableEquipments    : any;

  //Initialize selected objects:
  public selectedModalities : string[] = [];
  public selectedEquipments : any = {};
  public selectedDurations  : any = {};

  //Initialize enable PET-CT coefficient field:
  public enableCoefPETInput   : boolean = false;

  //Initializate enable field controllers:
  public enableField : any = {
    'reporting_delay': false,
    'wait_time': false
  };

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
      domain                      : [ '', [Validators.required] ],
      name                        : [ '', [Validators.required] ],
      code                        : [ '' ],
      snomed                      : [ '' ],
      equipments                  : new FormControl({ value: '', disabled: true }, Validators.required),
      fk_modality                 : new FormControl({ value: '', disabled: true }, Validators.required),
      has_interview               : [ 'false' ],
      informed_consent            : [ 'false' ],
      status                      : [ 'true' ],
      preparation                 : [ '' ],
      procedure_template          : [ '' ],
      report_template             : [ '' ],
      coefficient                 : [ '', [Validators.required] ],
      reporting_delay_controller  : [ 'false' ],
      reporting_delay             : [ '' ],
      wait_time_controller        : [ 'false' ],
      wait_time                   : [ '' ],
    });
  }

  ngOnInit(): void {
    //Find references:
    this.findReferences();

    //Enable source editing CKEditor for Superuser:
    if(this.sharedProp.userLogged.permissions[0].role == 1){
      //Add sourceEditing to the toolbar:
      if(!this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.includes('sourceEditing')){ this.sharedProp.mainSettings.CKEditorConfig.toolbar.items.push('sourceEditing'); }
    }

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
        this.sharedFunctions.find(this.sharedProp.element, params, async (res) => {
          //Check operation status:
          if(res.success === true){
            //Find references (disabled inputs):
            this.onChangeBranch(false, res.data[0]);

            //Prevent undefined error on CKEditor fields:
            if(res.data[0].preparation == undefined ){ res.data[0].preparation = ''; }
            if(res.data[0].procedure_template == undefined ){ res.data[0].procedure_template = ''; }
            if(res.data[0].report_template == undefined ){ res.data[0].report_template = ''; }

            //Send data to the form:
            this.setReactiveForm({
              domain                      : res.data[0].domain.organization + '.' + res.data[0].domain.branch,
              fk_modality                 : res.data[0].fk_modality,
              name                        : res.data[0].name,
              code                        : res.data[0].code,
              snomed                      : res.data[0].snomed,
              equipments                  : new FormControl({ value: [] }, Validators.required),
              status                      : [ `${res.data[0].status}`, [Validators.required]], //Use back tip notation to convert string
              has_interview               : [ `${res.data[0].has_interview}`, [Validators.required]], //Use back tip notation to convert string
              informed_consent            : [ `${res.data[0].informed_consent}`, [Validators.required]], //Use back tip notation to convert string
              preparation                 : res.data[0].preparation,
              procedure_template          : res.data[0].procedure_template,
              report_template             : res.data[0].report_template,
              coefficient                 : res.data[0].coefficient,
              reporting_delay_controller  : [ 'false' ],
              reporting_delay             : [ '' ],
              wait_time_controller        : [ 'false' ],
              wait_time                   : [ '' ]
            });

            //Set empty array value to prevent "Value must be an array in multiple-selection mode":
            this.form.controls['equipments'].setValue([]);

            //Check if selected Modality is PET-CT:
            if(await this.isPET(res.data[0].fk_modality)){
              //Set enable coefficient PET-CT input:
              this.enableCoefPETInput = true;
            }

            //Check reporting delay:
            if(res.data[0].reporting_delay !== undefined && res.data[0].reporting_delay !== null && res.data[0].reporting_delay !== ''){
              this.enableField.reporting_delay = true;
              this.form.controls['reporting_delay'].setValue(res.data[0].reporting_delay);
              this.form.controls['reporting_delay_controller'].setValue('true');
            }

            //Check wait_time:
            if(res.data[0].wait_time !== undefined && res.data[0].wait_time !== null && res.data[0].wait_time !== ''){
              this.enableField.wait_time = true;
              this.form.controls['wait_time'].setValue(res.data[0].wait_time);
              this.form.controls['wait_time_controller'].setValue('true');
            }

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

  async onChangeModality(event: any){
    //Reset enable coefficient PET-CT input:
    this.enableCoefPETInput = false;

    //Check if selected Modality is PET-CT:
    if(await this.isPET(event.value)){
      //Set enable coefficient PET-CT input:
      this.enableCoefPETInput = true;
    }
  }

  async isPET(_id: string): Promise<boolean>{
    //Initialize result:
    let result = false;

    //Find in avalable modalities (await foreach):
    await Promise.all(Object.keys(this.availableModalities).map((key) => {
      //Check if modality _id is PET-CT:
      if(this.availableModalities[key]._id == _id && this.availableModalities[key].code_value == 'PT'){
        //Set enable coefficient PET-CT input:
        result = true;
      }
    }));

    //Return result:
    return result;
  }

  async onSubmit(){
    //Validate coefficient only in PET-CT Procedures:
    if(this.enableCoefPETInput === false){
      this.form.controls['coefficient'].clearValidators();
      this.form.controls['coefficient'].updateValueAndValidity();
      this.form.controls['coefficient'].setValue('');
    } else {
      this.form.controls['coefficient'].setValidators([Validators.required]);
      this.form.controls['coefficient'].updateValueAndValidity();
    }

    //Validate fields:
    if(this.form.valid){
      //Create save object to preserve data types in form.value (Clone objects with spread operator):
      let procedureSaveData = { ...this.form.value };

      //Data normalization - Domain:
      const domain = procedureSaveData.domain.split('.');
      procedureSaveData.domain = {
        organization  : domain[0],
        branch        : domain[1]
      }

      //Data normalization - Booleans types (mat-option cases):
      if(typeof procedureSaveData.status != "boolean"){ procedureSaveData.status = procedureSaveData.status.toLowerCase() == 'true' ? true : false; }
      if(typeof procedureSaveData.has_interview != "boolean"){ procedureSaveData.has_interview = procedureSaveData.has_interview.toLowerCase() == 'true' ? true : false; }
      if(typeof procedureSaveData.informed_consent != "boolean"){ procedureSaveData.informed_consent = procedureSaveData.informed_consent.toLowerCase() == 'true' ? true : false; }

      //Data normalization - Equipments array of objects:
      procedureSaveData.equipments = []; //Reset array of objects equipments (Ignore previous content - Form control only).
      await Promise.all(Object.keys(this.selectedDurations).map((current, index) => {
        procedureSaveData.equipments[index] = {
          fk_equipment: current,
          duration: this.selectedDurations[current].duration
        };
      }));

      //Check reporting delay:
      if(procedureSaveData.reporting_delay_controller == 'false'){
        delete procedureSaveData.reporting_delay_controller;
        //Considerate unset cases:
        if(this.form_action == 'insert'){
          delete procedureSaveData.reporting_delay;
        }
      } else {
        delete procedureSaveData.reporting_delay_controller;
      }

      //Check wait time:
      if(procedureSaveData.wait_time_controller == 'false'){
        delete procedureSaveData.wait_time_controller;
        //Considerate unset cases:
        if(this.form_action == 'insert'){
          delete procedureSaveData.wait_time;
        }
      } else {
        delete procedureSaveData.wait_time_controller;
      }

      //Save data:
      this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, procedureSaveData, this.keysWithValues, (res) => {
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

  onChangeEnableController(event: any, field_name: string, default_value: string){
    if(event.value == 'true'){
      this.enableField[field_name] = true;
      this.form.controls[field_name].setValue(default_value);
    } else {
      this.enableField[field_name] = false;
      this.form.controls[field_name].setValue('');
    }
  }
}
