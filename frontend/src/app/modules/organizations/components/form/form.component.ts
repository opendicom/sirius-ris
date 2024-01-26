import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
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
    public  sharedProp      : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de organizaciones',
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
      password_cert : ['']
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
          'proj[password_cert]': 1  // base64cert is not in the default projection.
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
              password_cert : ''
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
    }

  }
  
  async onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Data normalization - Booleans types (mat-option cases):
      if(typeof this.form.value.status != "boolean"){ this.form.value.status = this.form.value.status.toLowerCase() == 'true' ? true : false; }

      //Check if there is logo file selected (Multipart form):
      if(this.selectedLogoFile !== null || this.selectedCertFile !== null){
        //Initializate File Handler:
        let fileHandler = [];

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

        //Save data with Multipart form:
        this.sharedFunctions.saveMultipart(this.form_action, this.sharedProp.element, this._id, this.form.value, this.keysWithValues, fileHandler, (res) => {
          //Response the form according to the result:
          this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
        });
        
      //Normal save (without logo):
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

  onDeleteFileRef(fieldName: string){
    this.sharedFunctions.deleteFileRef(this.sharedProp.element, this._id, fieldName, (res) => {
      //Check result:
      if(res.success == true){
        this.sharedFunctions.sendMessage('Archivo eliminado exitosamente', { duration : 2000 });

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
        }
      }
    });
  }
}
