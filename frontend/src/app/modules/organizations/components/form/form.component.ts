import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { UsersAuthService } from '@auth/services/users-auth.service';                   // Users Auth Service
import { ISO_3166 } from '@env/environment';                                            // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  public country_codes    : any = ISO_3166;

  //Initialize Selected Files Controllers:
  public selectedLogoFile       : any = null;
  public selectedLogoController : boolean = false;
  public selectedCertFile       : any = null;
  public selectedCertController : boolean = false;

  //White labeling logo controllers:
  public selectedLogoHorizontalFile       : any = null;
  public selectedLogoHorizontalController : boolean = false;
  public selectedLogoVerticalFile         : any = null;
  public selectedLogoVerticalController   : boolean = false;
  public selectedLogoWelcomeFile          : any = null;
  public selectedLogoWelcomeController    : boolean = false;

  //White labeling logo previews (data URI from FileReader or DB):
  public previewLogoHorizontal : string | null = null;
  public previewLogoVertical   : string | null = null;
  public previewLogoWelcome    : string | null = null;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

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
    public  formBuilder     : FormBuilder,
    private router          : Router,
    private objRoute        : ActivatedRoute,
    private i18n            : I18nService,
    public  sharedProp      : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    private userAuth        : UsersAuthService,
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : this.i18n.instant('ORGANIZATIONS.FORM.TITLE'),
      content_icon  : 'apartment',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('organizations');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      short_name    : ['', [Validators.required]],
      name          : ['', [Validators.required]],
      OID           : [''],
      country_code  : [ this.sharedProp.mainSettings.appSettings.default_country, [Validators.required]],
      structure_id  : [''],
      suffix        : [''],
      status        : ['true'],
      password_cert : [''],
      white_labeling_label : ['']
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
        const params = {
          'filter[_id]': this._id,
          'proj[short_name]': 1,
          'proj[name]': 1,
          'proj[OID]': 1,
          'proj[country_code]': 1,
          'proj[structure_id]': 1,
          'proj[suffix]': 1,
          'proj[status]': 1,
          'proj[base64_logo]': 1,   // base64logo is not in the default projection.
          'proj[base64_cert]': 1,   // base64cert is not in the default projection.
          'proj[password_cert]': 1, // base64cert is not in the default projection.
          'proj[white_labeling]': 1
        };

        //Find element to update:
        this.sharedFunctions.find(this.sharedProp.element, params, (res) => {
          //Check operation status:
          if(res.success === true){
            //Send data to the form:
            this.setReactiveForm({
              short_name    : res.data[0].short_name,
              name          : res.data[0].name,
              OID           : res.data[0].OID,
              country_code  : res.data[0].country_code,
              structure_id  : res.data[0].structure_id,
              suffix        : res.data[0].suffix,
              status        : [ `${res.data[0].status}` ], //Use back tip notation to convert string,
              password_cert : '',
              white_labeling_label : [ res.data[0].white_labeling?.label || '' ]
            });

            //Set base64_logo:
            if(res.data[0].base64_logo !== null && res.data[0].base64_logo !== undefined && res.data[0].base64_logo !== ''){
              //Set selected Logo Controller:
              this.selectedLogoController = true;
            }

            //Set base64_cert:
            if(res.data[0].base64_cert !== null && res.data[0].base64_cert !== undefined && res.data[0].base64_cert !== ''){
              //Set selected Logo Controller:
              this.selectedCertController = true;
            }

            //Set white labeling logos preview:
            if(res.data[0].white_labeling?.base64_logo_horizontal){
              this.selectedLogoHorizontalController = true;
              this.previewLogoHorizontal = this.sharedFunctions.getLogoDataURI(res.data[0].white_labeling.base64_logo_horizontal);
            }
            if(res.data[0].white_labeling?.base64_logo_vertical){
              this.selectedLogoVerticalController = true;
              this.previewLogoVertical = this.sharedFunctions.getLogoDataURI(res.data[0].white_labeling.base64_logo_vertical);
            }
            if(res.data[0].white_labeling?.base64_logo_welcome){
              this.selectedLogoWelcomeController = true;
              this.previewLogoWelcome = this.sharedFunctions.getLogoDataURI(res.data[0].white_labeling.base64_logo_welcome);
            }

            //Get property keys with values:
            this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage(this.i18n.instant('COMMON.ERROR_EDITING_ELEMENT') + res.message);
            this.router.navigate(['/' + this.sharedProp.element + '/list']);
          }
        });
      }
    }
  }

  onFileSelected(event: any, type: string){
    //Set selected file:
    switch(type){
      case 'logo':
        this.selectedLogoFile = <File>event.target.files[0];
        this.selectedLogoController = true;
        break;
      case 'cert':
        this.selectedCertFile = <File>event.target.files[0];
        this.selectedCertController = true;
        break;
      case 'base64_logo_horizontal': {
        const file = <File>event.target.files[0];
        if(!file) return;
        this.selectedLogoHorizontalFile = file;
        this.selectedLogoHorizontalController = true;
        this._readFilePreview(file, (r) => { this.previewLogoHorizontal = r; });
        break;
      }
      case 'base64_logo_vertical': {
        const file = <File>event.target.files[0];
        if(!file) return;
        this.selectedLogoVerticalFile = file;
        this.selectedLogoVerticalController = true;
        this._readFilePreview(file, (r) => { this.previewLogoVertical = r; });
        break;
      }
      case 'base64_logo_welcome': {
        const file = <File>event.target.files[0];
        if(!file) return;
        this.selectedLogoWelcomeFile = file;
        this.selectedLogoWelcomeController = true;
        this._readFilePreview(file, (r) => { this.previewLogoWelcome = r; });
        break;
      }
    }

  }

  async onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Data normalization - Booleans types (mat-option cases):
      if(typeof this.form.value.status != "boolean"){ this.form.value.status = this.form.value.status.toLowerCase() == 'true' ? true : false; }

      //Move white_labeling_label into the flat "white_labeling.label" key expected by the backend:
      const formData: any = { ...this.form.value };
      const wlLabel = formData.white_labeling_label;
      delete formData.white_labeling_label;

      if(wlLabel !== null && wlLabel !== undefined && wlLabel !== ''){
        formData['white_labeling.label'] = wlLabel;
      } else if(this.form_action === 'update'){
        //Empty label on update: send a non-empty marker to unset the field in the DB:
        formData['unset.white_labeling.label'] = '1';
      }

      //Check if there is logo file selected (Multipart form):
      if(this.selectedLogoFile !== null || this.selectedCertFile !== null
        || this.selectedLogoHorizontalFile !== null || this.selectedLogoVerticalFile !== null || this.selectedLogoWelcomeFile !== null){
        //Initializate File Handler:
        let fileHandler: any[] = [];

        //Check Logo File:
        if(this.selectedLogoFile !== null){
          //Set uploaded_logo in File Handler:
          fileHandler.push({
            fileRequestKeyName: 'uploaded_logo',
            selectedFile: this.selectedLogoFile
          });
        }

        //Check Cert File:
        if(this.selectedCertFile !== null){
          //Set uploaded_cert in File Handler:
          fileHandler.push({
            fileRequestKeyName: 'uploaded_cert',
            selectedFile: this.selectedCertFile
          });
        }

        //Check white labeling logo files:
        if(this.selectedLogoHorizontalFile !== null){
          fileHandler.push({ fileRequestKeyName: 'uploaded_base64_logo_horizontal', selectedFile: this.selectedLogoHorizontalFile });
        }
        if(this.selectedLogoVerticalFile !== null){
          fileHandler.push({ fileRequestKeyName: 'uploaded_base64_logo_vertical', selectedFile: this.selectedLogoVerticalFile });
        }
        if(this.selectedLogoWelcomeFile !== null){
          fileHandler.push({ fileRequestKeyName: 'uploaded_base64_logo_welcome', selectedFile: this.selectedLogoWelcomeFile });
        }

        //Save data with Multipart form:
        this.sharedFunctions.saveMultipart(this.form_action, this.sharedProp.element, this._id, formData, this.keysWithValues, fileHandler, (res) => {
          //Response the form according to the result:
          if(res.success === true) {
            const savedId = res?.data?._id || res?.data?.[0]?._id || this._id;
            if(savedId) {
              this._id = savedId;
              this._syncSessionWhiteLabeling();
            }
          }
          this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
        });

      //Normal save (without logo):
      } else {
        //Save data:
        this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, formData, this.keysWithValues, (res) => {
          //Response the form according to the result:
          if(res.success === true) {
            const savedId = res?.data?._id || res?.data?.[0]?._id || this._id;
            if(savedId) {
              this._id = savedId;
              this._syncSessionWhiteLabeling();
            }
          }
          this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
        });
      }
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  onDeleteFileRef(fieldName: string){
    this.sharedFunctions.deleteFileRef(this.sharedProp.element, this._id, fieldName, (res) => {
      //Check result:
      if(res.success == true){
        this.sharedFunctions.sendMessage(this.i18n.instant('ORGANIZATIONS.FORM.FILE_DELETED_SUCCESS'), { duration : 2000 });
        this._syncSessionWhiteLabeling(fieldName);

        //Reset logo file controllers:
        switch(fieldName){
          case 'base64_logo':
            this.selectedLogoFile = null;
            this.selectedLogoController = false;
            break;
          case 'base64_cert':
            this.selectedCertFile = null;
            this.selectedCertController = false;
            break;
          case 'white_labeling.base64_logo_horizontal':
            this.selectedLogoHorizontalFile = null;
            this.selectedLogoHorizontalController = false;
            this.previewLogoHorizontal = null;
            break;
          case 'white_labeling.base64_logo_vertical':
            this.selectedLogoVerticalFile = null;
            this.selectedLogoVerticalController = false;
            this.previewLogoVertical = null;
            break;
          case 'white_labeling.base64_logo_welcome':
            this.selectedLogoWelcomeFile = null;
            this.selectedLogoWelcomeController = false;
            this.previewLogoWelcome = null;
            break;
        }
      }
    });
  }

  //Read a selected image file and return it as a data URI for preview:
  private _readFilePreview(file: File, callback: (result: string) => void): void {
    const reader = new FileReader();
    reader.onload = (e: any) => callback(e.target.result);
    reader.readAsDataURL(file);
  }

  //Updates the logged-in session's branding when the edited organization is the active one:
  private _syncSessionWhiteLabeling(deletedField?: string): void {
    const organizationId = this._id;
    if(!organizationId) return;

    if(deletedField) {
      //Delete case: drop the field from the session's currently cached white_labeling (if any):
      const currentWL = this.sharedProp.userLogged?.permissions?.[0]?.white_labeling;
      let wl: any = currentWL ? { ...currentWL } : null;
      if(wl) {
        delete wl[deletedField.replace('white_labeling.', '')];
        if(Object.keys(wl).length === 0) wl = null;
      }
      if(this.userAuth.refreshSessionWhiteLabeling(organizationId, wl)){
        this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();
      }
    } else {
      //Save case: re-fetch updated white_labeling from DB, push it into the session:
      this.sharedFunctions.find('organizations', {
        'filter[_id]': organizationId,
        'proj[white_labeling]': 1
      }, (res: any) => {
        if(res.success !== true) return;
        const wl = res.data[0]?.white_labeling || null;
        if(this.userAuth.refreshSessionWhiteLabeling(organizationId, wl)){
          this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();
        }
      });
    }
  }
}
