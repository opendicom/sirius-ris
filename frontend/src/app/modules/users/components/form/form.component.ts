import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';                                       // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';                                   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';                                     // Shared Functions
import { app_setting, document_types, ISO_3166, user_roles, user_concessions, regexObjectId } from '@env/environment';  // Enviroment
import { map, mergeMap, filter } from 'rxjs/operators';                                                                 // Reactive Extensions (RxJS)
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

  //Initializate validation tab errors:
  public personTabErrors      : boolean = false;
  public userTabErrors        : boolean = false;
  public permissionTabErrors  : boolean = false;

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
  public person_id        : string = '';
  public user_id          : string = '';
  private keysWithValues  : Array<string> = [];
  public form_action      : any;

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

    //Get data from the DB (form_action):
    if(this.form_action == 'insert'){
      //Check if have an _id:
      if(this.objRoute.snapshot.params['_id']){
        //Set person_id:
        this.person_id = this.objRoute.snapshot.params['_id'];

        //Check if _id it is a ObjectId (person _id):
        if(regexObjectId.test(this.objRoute.snapshot.params['_id'])){
          //Set people params:
          const people_params = {
            'filter[_id]' : this.objRoute.snapshot.params['_id']
          };

          //Create observable people:
          const obsPeople = this.sharedFunctions.findRxJS('people', people_params, true);

          //Observe content (Subscribe):
          obsPeople.subscribe({
            next: (res) => {
              //Check operation status:
              if(res.success === true){
                //Check response:
                if(Object.keys(res.data).length > 0){
                  //Clear data to FormControl elements:
                  this.clearFormFields();

                  //Send data to FormControl elements:
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

                  //Get property keys with values:
                  this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);
                }
              }
            },
          });

        //Check that it is not a normal insert:
        } else if(this.objRoute.snapshot.params['_id'] != '0'){
          //Split new document (check person component - insert case):
          const new_document = this.objRoute.snapshot.params['_id'].split('|');

          //Set document into Form Values:
          this.form.get('person.doc_country_code')?.setValue(new_document[0]);
          this.form.get('person.doc_type')?.setValue(new_document[1]);
          this.form.get('person.document')?.setValue(new_document[2]);
        }
      }

    } else if(this.form_action == 'update'){
      //Extract sent data (Parameters by routing):
      this.user_id = this.objRoute.snapshot.params['_id'];

      //Check if element is not empty:
      if(this.user_id != ''){
        //Request params:
        const params = {
          'filter[_id]'     : this.user_id,
          'proj[password]'  : 0
        };

        //Find element to update:
        this.sharedFunctions.find(this.sharedProp.element, params, (res) => {

          //UPDATE PERSON AND USER:
          //Check operation status:
          if(res.success === true){
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

              //Get property keys with values:
              this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

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

              //Get property keys with values:
              this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);
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

              //Get property keys with values:
              this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);
            }
          }
        }
      });
    }
  }

  setPerson(personData: any = false): void {
    //Check person data:
    if(personData){
      //Set person_id:
      this.person_id = personData._id;

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
      this.form.get('person.birth_date')?.setValue(new Date(personData.birth_date.split('T')[0].replace(/-/g, '/'))); //Replace '-' by '/' to prevent one day off JS Date error.
    }
  }

  setUser(userData: any = false): void {
    //Check user data:
    if(userData){
      //Set user_id:
      this.user_id = userData._id;

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
    //Clear _ids:
    this.person_id = '';
    this.user_id = '';

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
    //Check person tab errors:
    if(this.form.controls['person'].status == 'VALID'){
      this.personTabErrors = false;
    } else {
      this.personTabErrors = true;
    }

    //Check user tab errors:
    if(this.form.controls['user'].status == 'VALID'){
      this.userTabErrors = false;
    } else {
      this.userTabErrors = true;
    }

    //Check permission tab errors:
    if(this.permissions.length > 0){
      this.permissionTabErrors = false;
    } else {
      this.permissionTabErrors = true;
      //Send message:
      this.sharedFunctions.sendMessage('El usuario debe poseer al menos un permiso para poder ser guardado.');
    }

    //Check that the entered passwords are the same:
    if(this.form.value.user.password == this.form.value.user.password_repeat){
      this.userTabErrors = false;

      //Validate fields:
      if(this.form.valid){
        //Check permissions:
        if(this.permissions.length > 0){
          //Data normalization - Booleans types:
          this.form.get('user.status')?.setValue(this.form.value.user.status.toLowerCase() == 'true' ? true : false);
          this.form.get('user.professional[vacation]')?.setValue(this.form.value.user['professional[vacation]'].toLowerCase() == 'true' ? true : false);

          //Data normalization - Dates types:
          this.form.get('person.birth_date')?.setValue(this.sharedFunctions.setDatetimeFormat(this.form.value.person.birth_date));

          //Set permissions in form user object:
          this.form.value.user['permissions'] = this.permissions;

          //Create observable Save Person:
          const obsSavePerson = this.sharedFunctions.saveRxJS(this.personOperation, 'people', this.person_id, this.form.value.person, this.keysWithValues);

          //Create observable Save User:
          const obsSaveUser = obsSavePerson.pipe(
            //Check first result (save person):
            map((res: any) => {
              //Check operation status:
              if(res.success === true){
                //Set fk_person in form user object with assigned _id:
                this.form.value.user['fk_person'] = res.data._id;
              }

              //Return response:
              return res;
            }),

            //Filter that only success continue:
            filter((res: any) => res.success === true),

            //Save user with the fk_person (Return observable):
            mergeMap(() => this.sharedFunctions.saveRxJS(this.userOperation, 'users', this.user_id, this.form.value.user, this.keysWithValues)),
          );

          //Observe content (Subscribe):
          obsSaveUser.subscribe({
            next: (res) => {
              //Response the form according to the result:
              this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
            },
          });
        }
      }
    } else {
      this.userTabErrors = true;

      //Send message:
      this.sharedFunctions.sendMessage('Las contraseñas ingresadas no coinciden entre si.');
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
