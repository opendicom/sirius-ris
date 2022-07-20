import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                                 // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';                         // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';                     // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';                       // Shared Functions
import { app_setting, document_types, ISO_3166, user_roles, user_concessions } from '@env/environment';   // Enviroment
import { map, mergeMap } from 'rxjs/operators';                                                           // Reactive Extensions (RxJS)
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  public settings         : any = app_setting;
  public country_codes    : any = ISO_3166;
  public document_types   : any = document_types;
  public userRoles        : any = user_roles;
  public userConcessions  : any = user_concessions;

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableServices      : any;

  //Initializate response, user_params and permissions objects:
  private response      : any = {};
  private user_params   : any = {};
  private people_params : any = {};
  public  user_data     : any = {};
  public  permissions   : any = {};

  //Initializate operations:
  public personOperation  : string = 'insert';
  public userOperation    : string = 'insert';

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
    //Find references:
    this.findReferences();

    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de usuarios',
      content_icon  : 'people',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('users');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      //Person fields:
      'doc_country_code'  : [ this.settings.default_country, [Validators.required]],
      'doc_type'          : [ this.settings.default_doc_type, [Validators.required]],
      'document'          : [ '', [Validators.required]],
      'name_01'           : [ '', [Validators.required]],
      'name_02'           : [ '', []],
      'surname_01'        : [ '', [Validators.required]],
      'surname_02'        : [ '', []],
      'birth_date'        : [ '', [Validators.required]],
      'phone_numbers[0]'  : [ '', [Validators.required]],
      'phone_numbers[1]'  : [ '', []],

      //User fields:
      'password'                  : [ '', [Validators.required]],
      'password_repeat'           : [ '', [Validators.required]],
      'email'                     : [ '', []],
      'status'                    : [ 'true', []],
      'professional[id]'          : [ '', []],
      'professional[description]' : [ '', []],
      'professional[workload]'    : [ '', []],
      'professional[vacation]'    : [ 'false', []],

      //User permissions:
      'domain_type'       : [ 'organization', [],],
      'domain'            : [ '', []],
      'role'              : [ '', []],
      'concessions'       : [ '', []]
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];
  }

  onSetDocument(preventClear: boolean = false){
    //Check document fields content:
    if(this.form.value.document != '' && this.form.value.doc_country_code != '' && this.form.value.doc_type != ''){

      //Set people params:
      const people_params = {
        'filter[elemMatch][documents][document]' : this.form.value.document,
        'filter[elemMatch][documents][doc_country_code]' : this.form.value.doc_country_code,
        'filter[elemMatch][documents][doc_type]' : this.form.value.doc_type
      };

      //Create observable people:
      const obsPeople = this.sharedFunctions.findRxJS('people', people_params, true);

      //Create observable obsUser:
      const obsUser = obsPeople.pipe(
        //Check first result (find person):
        map((res: any) => {
          //Clear response and user_params objects:
          this.response = {};
          this.user_params = {};

          //Check operation status:
          if(res.success === true){
            //Check data:
            if(Object.keys(res.data).length > 0){
              //Set user params:
              this.user_params = {
                'filter[fk_person]' : res.data[0]._id,
                'proj[password]'    : 0
              };

              //Preserve response (only person data case):
              this.response = res;
            }
          }

          //Return response:
          return res;
        }),

        //Search user with the fk_person (Return observable):
        mergeMap(() => this.sharedFunctions.findRxJS('users', this.user_params, true)),

        //Check second result (find user):
        map((res: any) => {

          //Check operation status:
          if(res.success === true){
            //Check data:
            if(Object.keys(res.data).length == 0 || Object.keys(this.user_params).length == 0){
              //Preserve person response (only person data case):
              res = this.response;
            } else {
              //Preserve user response (in case you need to control from onSetEmail):
              this.response = res;
            }
          }

          //Return response:
          return res;
        })
      );

      //Observe content (Subscribe):
      obsUser.subscribe({
        next: (res) => {
          //Check response:
          if(Object.keys(res).length > 0){

            //UPDATE PERSON AND USER:
            if(res.data[0].fk_person){
              //Clear data to FormControl elements:
              this.clearFormFields();

              //Send data to FormControl elements:
              this.setPerson(res.data[0].person);
              this.setUser(res.data[0]);

              //Set current permissions:
              this.permissions = res.data[0].permissions;

              //Remove validator required in passwords field:
              this.form.controls['password'].clearValidators();
              this.form.controls['password_repeat'].clearValidators();
              this.form.controls['password'].updateValueAndValidity();
              this.form.controls['password_repeat'].updateValueAndValidity();

              //Set operations
              this.personOperation = 'update';
              this.userOperation = 'update';

            //UPDATE PERSON AND INSERT USER:
            } else {
              //Clear data to FormControl elements:
              this.clearFormFields();

              //Send data to FormControl elements (Set only person fields):
              this.setPerson(res.data[0]);

              //Clear current permissions:
              this.permissions = {};

              //Add validator required in passwords field:
              this.form.controls['password'].setValidators([Validators.required]);
              this.form.controls['password_repeat'].setValidators([Validators.required]);
              this.form.controls['password'].updateValueAndValidity();
              this.form.controls['password_repeat'].updateValueAndValidity();

              //Set operations:
              this.personOperation = 'update';
              this.userOperation = 'insert';

            }

          //INSERT PERSON AND USER:
          } else {
            //Clear data to FormControl elements:
            this.clearFormFields(true);

            //Clear current permissions:
            this.permissions = {};

            //Add validator required in passwords field:
            this.form.controls['password'].setValidators([Validators.required]);
            this.form.controls['password_repeat'].setValidators([Validators.required]);
            this.form.controls['password'].updateValueAndValidity();
            this.form.controls['password_repeat'].updateValueAndValidity();

            //Set operations:
            this.personOperation = 'insert';
            this.userOperation = 'insert';
          }
        }
      });
    } else {
      //Check prevent clear (selectionChange: doc_country_code and doc_type):
      if(preventClear == false){
        //Clear data to FormControl elements:
        this.clearFormFields();
      }
    }
  }

  onSetEmail(){
    //Check the email field is not empty:
    if(this.form.value.email != ''){
      //Set user params:
      const user_params = {
        'filter[email]'   : this.form.value.email,
        'proj[password]'  : 0
      };

      //Create observable users:
      const obsUsers = this.sharedFunctions.findRxJS('users', user_params, true);

      //Observe content (Subscribe):
      obsUsers.subscribe({
        next: (res) => {
          //Check current response and res data (user data):
          if(res.success === true && Object.keys(res.data[0]).length > 0){
            //Get native element to set focus:
            const inputEmail = document.getElementById('IDtxtEmail');

            //Check if document field is empty:
            if(this.form.value.document != ''){

              //Check that the user is human:
              if(res.data[0].person){
                //Create operation handler:
                const operationHandler = {
                  user_data       : res.data[0]
                };

                //Open dialog to decide what operation to perform:
                this.sharedFunctions.openDialog('found_person', operationHandler, (result) => {
                  //Check if result is true:
                  if(result){
                    //Clear data to FormControl elements:
                    this.clearFormFields();

                    //Send data to FormControl elements:
                    this.setPerson(res.data[0].person);
                    this.setUser(res.data[0]);

                    //Set current permissions:
                    this.permissions = res.data[0].permissions;

                    //Remove validator required in passwords field:
                    this.form.controls['password'].clearValidators();
                    this.form.controls['password_repeat'].clearValidators();
                    this.form.controls['password'].updateValueAndValidity();
                    this.form.controls['password_repeat'].updateValueAndValidity();

                    //Set operations
                    this.personOperation = 'update';
                    this.userOperation = 'update';

                  } else {
                    //Clear email input and focus on this:
                    this.form.controls['email'].setValue('');
                    inputEmail?.focus();
                  }
                });
              } else {
                //Send message, clear email input and focus on this:
                this.sharedFunctions.sendMessage('El correo indicado NO puede utilizarse, el mismo se encuentra asociado a un usuario de tipo máquina.')
                this.form.controls['email'].setValue('');
                inputEmail?.focus();
              }

            //UPDATE PERSON AND USER (Empty person form case):
            } else {
              //Clear data to FormControl elements:
              this.clearFormFields();

              //Send data to FormControl elements:
              this.setPerson(res.data[0].person);
              this.setUser(res.data[0]);

              //Set current permissions:
              this.permissions = res.data[0].permissions;

              //Remove validator required in passwords field:
              this.form.controls['password'].clearValidators();
              this.form.controls['password_repeat'].clearValidators();
              this.form.controls['password'].updateValueAndValidity();
              this.form.controls['password_repeat'].updateValueAndValidity();

              //Set operations
              this.personOperation = 'update';
              this.userOperation = 'update';
            }
          }
        }
      });
    }
  }

  onSubmit(){
    console.log(this.form.value)
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  setPerson(personData: any = false): void {
    //Check person data:
    if(personData){
      //Send data to FormControl elements (Set person fields):
      this.form.controls['doc_country_code'].setValue(personData.documents[0].doc_country_code);
      this.form.controls['doc_type'].setValue(personData.documents[0].doc_type.toString());
      this.form.controls['document'].setValue(personData.documents[0].document);
      this.form.controls['name_01'].setValue(personData.name_01);
      this.form.controls['name_02'].setValue(personData.name_02);
      this.form.controls['surname_01'].setValue(personData.surname_01);
      this.form.controls['surname_02'].setValue(personData.surname_02);
      this.form.controls['phone_numbers[0]'].setValue(personData.phone_numbers[0]);
      this.form.controls['phone_numbers[1]'].setValue(personData.phone_numbers[1]);
      this.form.controls['birth_date'].setValue(new Date(personData.birth_date));
    }
  }

  setUser(userData: any = false): void {
    //Check user data:
    if(userData){
      //Send data to FormControl elements (Set user fields):
      this.form.controls['email'].setValue(userData.email);
      this.form.controls['status'].setValue(`${userData.status}`); //Use back tip notation to convert string

      //If cointain professional data:
      if(userData.professional){
        this.form.controls['professional[id]'].setValue(userData.professional.id);
        this.form.controls['professional[description]'].setValue(userData.professional.description);
        this.form.controls['professional[workload]'].setValue(userData.professional.workload);
        this.form.controls['professional[vacation]'].setValue(`${userData.professional.vacation}`); //Use back tip notation to convert string
      }
    }
  }

  clearFormFields(preventClear: boolean = false){
    //Person fields:
    if(preventClear == false){
      this.form.controls['document'].setValue('');
      this.form.controls['doc_country_code'].setValue(this.settings.default_country);
      this.form.controls['doc_type'].setValue(this.settings.default_doc_type.toString());
    }
    this.form.controls['email'].setValue('');
    this.form.controls['name_01'].setValue('');
    this.form.controls['name_02'].setValue('');
    this.form.controls['surname_01'].setValue('');
    this.form.controls['surname_02'].setValue('');
    this.form.controls['phone_numbers[0]'].setValue('');
    this.form.controls['birth_date'].setValue('');

    //User fields:
    this.form.controls['status'].setValue('true');
    this.form.controls['password'].setValue('');
    this.form.controls['password_repeat'].setValue('');
    this.form.controls['professional[id]'].setValue('');
    this.form.controls['professional[description]'].setValue('');
    this.form.controls['professional[workload]'].setValue('');
    this.form.controls['professional[vacation]'].setValue('false');
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

    //Find services:
    this.sharedFunctions.find('services', params, (res) => {
      this.availableServices = res.data;
    });
  }
}
