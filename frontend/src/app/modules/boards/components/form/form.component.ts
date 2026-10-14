import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  //Initialize Selected File Control Variables (Board screen):
  public selectedFile           : any = null;
  public selectedScreenController : boolean = false;

  //Board screen preview (data URI from FileReader or DB):
  public previewScreen : string | null = null;

  //Set references objects:
  public availableOrganizations: any;
  public availableBranches: any;

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
    private sharedFunctions: SharedFunctionsService,
    private i18n: I18nService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : this.i18n.instant('BOARDS.FORM.TITLE'),
      content_icon  : 'monitor',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('boards');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      fk_branch : ['', [Validators.required]],
      name      : ['', [Validators.required, Validators.minLength(2), Validators.maxLength(32)]],
      details   : ['', [Validators.minLength(3), Validators.maxLength(128)]],
      status    : ['true']
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
            //Send data to the form:
            this.setReactiveForm({
              fk_branch : [res.data[0].fk_branch, [Validators.required]],
              name      : [res.data[0].name, [Validators.required, Validators.minLength(2), Validators.maxLength(32)]],
              details   : [res.data[0].details ?? '', [Validators.minLength(3), Validators.maxLength(128)]],
              status    : [ `${res.data[0].status}` ] //Use back tip notation to convert string
            });

            //Set base64_screen:
            if(res.data[0].base64_screen !== null && res.data[0].base64_screen !== undefined && res.data[0].base64_screen !== ''){
              this.selectedScreenController = true;
              this.previewScreen = this.sharedFunctions.getLogoDataURI(res.data[0].base64_screen);
            }

            //Get property keys with values:
            this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage(this.i18n.instant('BOARDS.FORM.EDIT_ERROR') + res.message);
            this.router.navigate(['/' + this.sharedProp.element + '/list']);
          }
        });
      }
    }
  }

  onFileSelected(event: any){
    //Set selected file:
    const file = <File>event.target.files[0];
    if(!file) return;
    this.selectedFile = file;
    this.selectedScreenController = true;
    this._readFilePreview(file, (r) => { this.previewScreen = r; });
  }

  onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Data normalization - Booleans types (mat-option cases):
      if(typeof this.form.value.status != "boolean"){ this.form.value.status = this.form.value.status.toLowerCase() == 'true' ? true : false; }

      //Check if there is a screen file selected (Multipart form):
      if(this.selectedFile !== null){
        //Set File Handler (The backend expects the field name "base64_screen"):
        const fileHandler = [{
          fileRequestKeyName: 'base64_screen',
          selectedFile: this.selectedFile
        }];

        //Save data with Multipart form:
        this.sharedFunctions.saveMultipart(this.form_action, this.sharedProp.element, this._id, this.form.value, this.keysWithValues, fileHandler, (res) => {
          //Response the form according to the result:
          this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
        });

      //Normal save (without screen):
      } else {
        //Save data:
        this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, this.form.value, this.keysWithValues, (res) => {
          //Response the form according to the result:
          this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
        });
      }
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

  onDeleteFileRef(fieldName: string){
    this.sharedFunctions.deleteFileRef(this.sharedProp.element, this._id, fieldName, (res) => {
      //Check result:
      if(res.success == true){
        this.sharedFunctions.sendMessage(this.i18n.instant('BOARDS.FORM.DELETE_FILE_SUCCESS'), { duration : 2000 });
        //Reset screen file controllers:
        this.selectedFile = null;
        this.selectedScreenController = false;
        this.previewScreen = null;
      }
    });
  }

  //Read a selected image file and return it as a data URI for preview:
  private _readFilePreview(file: File, callback: (result: string) => void): void {
    const reader = new FileReader();
    reader.onload = (e: any) => callback(e.target.result);
    reader.readAsDataURL(file);
  }
}
