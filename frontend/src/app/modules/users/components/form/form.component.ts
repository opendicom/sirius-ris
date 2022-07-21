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
  public  permissions   : any[] = [];

  //Initializate selected concession:
  public selectedConcession : number[] = [];

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
      person: this.formBuilder.group({
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
      }),

      //User fields:
      user: this.formBuilder.group({
        'password'                  : [ '', [Validators.required]],
        'password_repeat'           : [ '', [Validators.required]],
        'email'                     : [ '', []],
        'status'                    : [ 'true', []],
        'professional[id]'          : [ '', []],
        'professional[description]' : [ '', []],
        'professional[workload]'    : [ '', []],
        'professional[vacation]'    : [ 'false', []],
      }),

      //User permissions:
      'domain_type'       : [ 'organization', [],],
      'domain'            : [ '', []],
      'role'              : [ '', []],
      'concessions'       : [ [], []]
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];
  }

  onSetDocument(preventClear: boolean = false){
    //Check document fields content:
    if(this.form.value.person.document != '' && this.form.value.person.doc_country_code != '' && this.form.value.person.doc_type != ''){

      //Set people params:
      const people_params = {
        'filter[elemMatch][documents][document]' : this.form.value.person.document,
        'filter[elemMatch][documents][doc_country_code]' : this.form.value.person.doc_country_code,
        'filter[elemMatch][documents][doc_type]' : this.form.value.person.doc_type
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
              this.form.get('user.password')?.clearValidators();
              this.form.get('user.password_repeat')?.clearValidators();
              this.form.get('user.password')?.updateValueAndValidity();
              this.form.get('user.password_repeat')?.updateValueAndValidity();

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
              this.permissions = [];

              //Add validator required in passwords field:
              this.form.get('user.password')?.setValidators([Validators.required]);
              this.form.get('user.password_repeat')?.setValidators([Validators.required]);
              this.form.get('user.password')?.updateValueAndValidity();
              this.form.get('user.password_repeat')?.updateValueAndValidity();

              //Set operations:
              this.personOperation = 'update';
              this.userOperation = 'insert';

            }

          //INSERT PERSON AND USER:
          } else {
            //Clear data to FormControl elements:
            this.clearFormFields(true);

            //Clear current permissions:
            this.permissions = [];

            //Add validator required in passwords field:
            this.form.get('user.password')?.setValidators([Validators.required]);
            this.form.get('user.password_repeat')?.setValidators([Validators.required]);
            this.form.get('user.password')?.updateValueAndValidity();
            this.form.get('user.password_repeat')?.updateValueAndValidity();

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
    if(this.form.value.user.email != ''){
      //Set user params:
      const user_params = {
        'filter[email]'   : this.form.value.user.email,
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
            if(this.form.value.person.document != ''){

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
                    this.form.get('user.password')?.clearValidators();
                    this.form.get('user.password_repeat')?.clearValidators();
                    this.form.get('user.password')?.updateValueAndValidity();
                    this.form.get('user.password_repeat')?.updateValueAndValidity();

                    //Set operations
                    this.personOperation = 'update';
                    this.userOperation = 'update';

                  } else {
                    //Clear email input and focus on this:
                    this.form.get('user.email')?.setValue('');
                    inputEmail?.focus();
                  }
                });
              } else {
                //Send message, clear email input and focus on this:
                this.sharedFunctions.sendMessage('El correo indicado NO puede utilizarse, el mismo se encuentra asociado a un usuario de tipo máquina.')
                this.form.get('user.email')?.setValue('');
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
              this.form.get('user.password')?.clearValidators();
              this.form.get('user.password_repeat')?.clearValidators();
              this.form.get('user.password')?.updateValueAndValidity();
              this.form.get('user.password_repeat')?.updateValueAndValidity();

              //Set operations
              this.personOperation = 'update';
              this.userOperation = 'update';
            }
          }
        }
      });
    }
  }

  setPerson(personData: any = false): void {
    //Check person data:
    if(personData){
      //Send data to FormControl elements (Set person fields):
      this.form.get('person.doc_country_code')?.setValue(personData.documents[0].doc_country_code);
      this.form.get('person.doc_type')?.setValue(personData.documents[0].doc_type.toString());
      this.form.get('person.document')?.setValue(personData.documents[0].document);
      this.form.get('person.name_01')?.setValue(personData.name_01);
      this.form.get('person.name_02')?.setValue(personData.name_02);
      this.form.get('person.surname_01')?.setValue(personData.surname_01);
      this.form.get('person.surname_02')?.setValue(personData.surname_02);
      this.form.get('person.phone_numbers[0]')?.setValue(personData.phone_numbers[0]);
      this.form.get('person.phone_numbers[1]')?.setValue(personData.phone_numbers[1]);
      this.form.get('person.birth_date')?.setValue(personData.birth_date);
    }
  }

  setUser(userData: any = false): void {
    //Check user data:
    if(userData){
      //Send data to FormControl elements (Set user fields):
      this.form.get('user.email')?.setValue(userData.email);
      this.form.get('user.status')?.setValue(`${userData.status}`); //Use back tip notation to convert string

      //If cointain professional data:
      if(userData.professional){
        this.form.get('user.professional[id]')?.setValue(userData.professional.id);
        this.form.get('user.professional[description]')?.setValue(userData.professional.description);
        this.form.get('user.professional[workload]')?.setValue(userData.professional.workload);
        this.form.get('user.professional[vacation]')?.setValue(`${userData.professional.vacation}`); //Use back tip notation to convert string
      }
    }
  }

  clearFormFields(preventClear: boolean = false){
    //Person fields:
    if(preventClear == false){
      this.form.get('person.document')?.setValue('');
      this.form.get('person.doc_country_code')?.setValue(this.settings.default_country);
      this.form.get('person.doc_type')?.setValue(this.settings.default_doc_type.toString());
    }
    this.form.get('person.email')?.setValue('');
    this.form.get('person.name_01')?.setValue('');
    this.form.get('person.name_02')?.setValue('');
    this.form.get('person.surname_01')?.setValue('');
    this.form.get('person.surname_02')?.setValue('');
    this.form.get('person.phone_numbers[0]')?.setValue('');
    this.form.get('person.phone_numbers[1]')?.setValue('');
    this.form.get('person.birth_date')?.setValue('');

    //User fields:
    this.form.get('user.status')?.setValue('true');
    this.form.get('user.password')?.setValue('');
    this.form.get('user.password_repeat')?.setValue('');
    this.form.get('user.professional[id]')?.setValue('');
    this.form.get('user.professional[description]')?.setValue('');
    this.form.get('user.professional[workload]')?.setValue('');
    this.form.get('user.professional[vacation]')?.setValue('false');
  }

  onCheckConcession(event: any, key: any){
    //Parse key to base10 integer:
    key = parseInt(key, 10);

    //Check if input is check or uncheck:
    if(event.checked){
      //Set current check into selectedDays array:
      this.selectedConcession.push(key);
    } else {
      //Remove from array by value:
      this.selectedConcession = this.selectedConcession.filter((e: number) => { return e !== key });
    }
  }

  addPermission(){
    //Check fields contents:
    if(this.form.value.domain_type !== '' && this.form.value.domain !== '' && this.form.value.role !== ''){
      //Parse role to base10 integer:
      this.form.value.role = parseInt(this.form.value.role, 10);

      //Create current permission object:
      let currentPermission: any = {
        role: this.form.value.role
      }

      //Add domain type and domain:
      currentPermission[this.form.value.domain_type] = this.form.value.domain;

      //Add concessions if not empty:
      if(this.selectedConcession.length > 0){
        currentPermission['concession'] = [...this.selectedConcession]; //Clone array with spread operator.
      }

      //Add currentPermission to permissions object:
      this.permissions.push(currentPermission);
    } else {
      //Send message:
      this.sharedFunctions.sendMessage('Debe cargar los datos necesarios para agregar el permiso al usuario.');
    }
  }

  removePermission(permissionIndex: number){
    this.permissions.splice(permissionIndex, 1);
  }

  onSubmit(){
    console.log('\nDATOS DE LA PERSONA:')
    console.log(this.form.value.person);
    console.log('\nDATOS DEL USUARIO:')
    console.log(this.form.value.user);
    console.log('\nPERMISOS DEL USUARIO:')
    console.log(this.permissions);

    //Validate fields:
    if(this.form.valid){
      //Data normalization - Booleans types:
      this.form.value.user.status = this.form.value.user.status.toLowerCase() == 'true' ? true : false;
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

    //Find services:
    this.sharedFunctions.find('services', params, (res) => {
      this.availableServices = res.data;
    });
  }
}
