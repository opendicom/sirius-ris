import { Component, OnInit } from '@angular/core';
import { KeyValue } from '@angular/common';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                     // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                          // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';         // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';           // Shared Functions
import { ValidateDocumentsService } from '@shared/services/validate-documents.service';       // Validate documents service
import { UsersService } from '@modules/users/services/users.service';                         // User Services
import { map, mergeMap, filter } from 'rxjs/operators';                                       // Reactive Extensions (RxJS)
import {                                                                                      // Enviroment
  document_types,
  ISO_3166,
  user_roles,
  user_concessions,
  regexObjectId,
  gender_types
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  public country_codes    : any = ISO_3166;
  public document_types   : any = document_types;
  public userRoles        : any = user_roles;
  public userConcessions  : any = user_concessions;
  public genderTypes      : any = gender_types;

  //Create unsorted function to prevent Angular from sorting 'wrong' ngFor keyvalue:
  unsorted = () => { return 0 }

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableServices      : any;

  //Initializate response & params objects:
  private response      : any = {};
  private user_params   : any = {};
  private people_params : any = {};
  public  user_data     : any = {};

  //Initialize complex objects:
  public  documents     : any[] = [];
  public  permissions   : any[] = [];

  //Initializate validation tab errors:
  public personTabErrors      : boolean = false;
  public userTabErrors        : boolean = false;
  public permissionTabErrors  : boolean = false;
  public genderCheckErrors    : boolean = false;

  //Initializate selected concession:
  public selectedConcession : number[] = [];

  //Initializate operations:
  public personOperation  : string = 'insert';
  public userOperation    : string = 'insert';

  //Initializate validation document vars:
  public registered_doc_type  : boolean = false;
  public validation_result    : boolean = false;
  public disabled_save_button : boolean = true;

  //Form destiny:
  public destiny: any;

  //Re-define method in component to use in HTML view:
  public getKeys  : any;
  public getMath  : any = Math;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public person_id              : string = '';
  public user_id                : string = '';
  private personKeysWithValues  : Array<string> = [];
  private userKeysWithValues    : Array<string> = [];
  public form_action            : any;

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
    private sharedFunctions : SharedFunctionsService,
    private sharedValidate  : ValidateDocumentsService,
    public  userService     : UsersService
  ){
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
        'doc_country_code'  : [ this.sharedProp.mainSettings.appSettings.default_country, [Validators.required]],
        'doc_type'          : [ this.sharedProp.mainSettings.appSettings.default_doc_type, [Validators.required]],
        'document'          : [ '', [Validators.required]],
        'name_01'           : [ '', [Validators.required]],
        'name_02'           : [ '', []],
        'surname_01'        : [ '', [Validators.required]],
        'surname_02'        : [ '', []],
        'gender'            : [ '', [Validators.required]],
        'birth_date'        : [ '', [Validators.required]],
        'phone_numbers[0]'  : [ '', [Validators.required]],
        'phone_numbers[1]'  : [ '', []],
      }),

      //User fields:
      user: this.formBuilder.group({
        'password'                  : [ '', [Validators.required]],
        'password_repeat'           : [ '', [Validators.required]],
        'email'                     : [ '', [Validators.required]],
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
    //Find references:
    this.findReferences();

    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];

    //Check if alternative destination has been established
    if(this.objRoute.snapshot.params['destiny'] !== undefined && this.objRoute.snapshot.params['destiny'] !== null && this.objRoute.snapshot.params['destiny'] !== ''){
      this.destiny = this.objRoute.snapshot.params['destiny'];
    } else {
      this.destiny = this.sharedProp.element;
    }

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
                  this.person_id = this.userService.setPerson(res.data[0], this.person_id, this.form);

                  //Set documents:
                  this.documents = res.data[0].documents;

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
                  this.personKeysWithValues = this.sharedFunctions.getKeys(this.form.value.person, false, true);
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

          //Set documents:
          this.documents[0] = {
            doc_country_code  : new_document[0],
            doc_type          : new_document[1],
            document          : new_document[2],
          };
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
            this.person_id = this.userService.setPerson(res.data[0].person, this.person_id, this.form);
            this.user_id = this.userService.setUser(res.data[0], this.user_id, this.form);

            //Set documents:
            this.documents = res.data[0].person.documents;

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
            this.personKeysWithValues = this.sharedFunctions.getKeys(this.form.value.person, false, true);
            this.userKeysWithValues = this.sharedFunctions.getKeys(this.form.value.user, false, true);

            //Validate document (Enable submit document):
            this.validateDocument();

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + res.message);
            this.router.navigate(['/' + this.destiny + '/list']);
          }
        });
      }
    }
  }

  validateDocument(){
    //Get validation result:
    const result = this.sharedValidate.validate(this.form.value.person.doc_country_code, this.form.value.person.doc_type, this.form.value.person.document);

    //Set validation result in component vars:
    this.registered_doc_type = result.registered_doc_type;

    //Check that the type of document is registered:
    if(result.registered_doc_type === true){
      this.validation_result = result.validation_result;

      //Enable and disable save button:
      if(result.validation_result === true){
        this.disabled_save_button = false;
      } else {
        this.disabled_save_button = true;
      }
    } else {
      //Enable save button (Document type not registered):
      this.disabled_save_button = false;
    }
  }

  onSetDocument(preventClear: boolean = false){
    //Validate document (Check registered_doc_type):
    this.validateDocument();

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
              this.person_id = this.userService.setPerson(res.data[0].person, this.person_id, this.form);
              this.user_id = this.userService.setUser(res.data[0], this.user_id, this.form);

              //Set documents:
              this.documents = res.data[0].person.documents;

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
              this.personKeysWithValues = this.sharedFunctions.getKeys(this.form.value.person, false, true);
              this.userKeysWithValues = this.sharedFunctions.getKeys(this.form.value.user, false, true);

            //UPDATE PERSON AND INSERT USER:
            } else {
              //Clear data to FormControl elements:
              this.clearFormFields();

              //Send data to FormControl elements (Set only person fields):
              this.person_id = this.userService.setPerson(res.data[0], this.person_id, this.form);

              //Set documents:
              this.documents = res.data[0].documents;

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
              this.personKeysWithValues = this.sharedFunctions.getKeys(this.form.value.person, false, true);
              this.userKeysWithValues = this.sharedFunctions.getKeys(this.form.value.user, false, true);
            }

          //INSERT PERSON AND USER:
          } else {
            //Clear data to FormControl elements:
            this.clearFormFields(true);

            //Set documents:
            this.documents[0] = {
              doc_country_code  : this.form.value.person.doc_country_code,
              doc_type          : this.form.value.person.doc_type,
              document          : this.form.value.person.document
            };

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
          if(res.success === true && res.data.length > 0){
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
                    this.person_id = this.userService.setPerson(res.data[0].person, this.person_id, this.form);
                    this.user_id = this.userService.setUser(res.data[0], this.user_id, this.form);

                    //Set documents:
                    this.documents = res.data[0].person.documents;

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
              this.person_id = this.userService.setPerson(res.data[0].person, this.person_id, this.form);
              this.user_id = this.userService.setUser(res.data[0], this.user_id, this.form);

              //Set documents:
              this.documents = res.data[0].person.documents;

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
              this.personKeysWithValues = this.sharedFunctions.getKeys(this.form.value.person, false, true);
              this.userKeysWithValues = this.sharedFunctions.getKeys(this.form.value.user, false, true);
            }
          }
        }
      });
    }
  }

  clearFormFields(preventClear: boolean = false){
    //Clear _ids:
    this.person_id = '';
    this.user_id = '';

    //Clear complex objects:
    this.documents = [];
    this.permissions = [];

    //Person fields:
    if(preventClear == false){
      this.form.get('person.document')?.setValue('');
      this.form.get('person.doc_country_code')?.setValue(this.sharedProp.mainSettings.appSettings.default_country);
      this.form.get('person.doc_type')?.setValue(this.sharedProp.mainSettings.appSettings.default_doc_type.toString());
    }
    this.form.get('person.name_01')?.setValue('');
    this.form.get('person.name_02')?.setValue('');
    this.form.get('person.surname_01')?.setValue('');
    this.form.get('person.surname_02')?.setValue('');
    this.form.get('person.gender')?.setValue('');
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
    //Set concession:
    this.selectedConcession = this.userService.setConcession(event, key, this.selectedConcession);
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

    //Check gender mat-opetion errors (mat-option validate but does not show validation error):
    if(this.form.controls['person'].value.gender !== '' && this.form.controls['person'].value.gender !== undefined) {
      this.genderCheckErrors = false;
    } else {
      this.genderCheckErrors = true;
    }

    //Check that the entered passwords are the same:
    if(this.form.value.user.password == this.form.value.user.password_repeat){
      //Validate fields:
      if(this.form.valid){
        //Check permissions:
        if(this.permissions.length > 0){
          //Create save object to preserve data types in form.value (Clone objects with spread operator):
          let personSaveData = { ...this.form.value.person };
          let userSaveData = { ...this.form.value.user} ;

          //Data normalization - Booleans types (mat-option cases):
          if(typeof userSaveData.status != "boolean"){ userSaveData.status = userSaveData.status.toLowerCase() == 'true' ? true : false; }

          //Data normalization - Dates types:
          personSaveData.birth_date = this.sharedFunctions.setDatetimeFormat(this.form.value.person.birth_date);

          //Data normalization - Set documents in form person object:
          personSaveData['documents'] = this.documents;

          //Data normalization - Set permissions in form user object:
          userSaveData['permissions'] = this.permissions;

          //Data normalization - Phone numbers to array:
          personSaveData['phone_numbers'] = [];
          personSaveData['phone_numbers'].push(personSaveData['phone_numbers[0]']);
          if(personSaveData['phone_numbers[1]'] != undefined && personSaveData['phone_numbers[1]'] != '') { personSaveData['phone_numbers'].push(personSaveData['phone_numbers[1]']); }

          //Data normalization - Professional:
          if(userSaveData['professional[id]'] != '' || userSaveData['professional[description]'] != '' || userSaveData['professional[workload]'] != ''){
            //Create object professional:
            userSaveData['professional'] = {};

            //Add sub-elements if exist:
            if(userSaveData['professional[id]'] != ''){ userSaveData.professional['id'] = userSaveData['professional[id]']; }
            if(userSaveData['professional[description]'] != ''){ userSaveData.professional['description'] = userSaveData['professional[description]']; }
            if(userSaveData['professional[workload]'] != ''){ userSaveData.professional['workload'] = userSaveData['professional[workload]']; }

            //Booleans types:
            if(typeof userSaveData['professional[vacation]'] != "boolean"){
              userSaveData.professional['vacation'] = userSaveData['professional[vacation]'].toLowerCase() == 'true' ? true : false;
            } else {
              userSaveData.professional['vacation'] = userSaveData['professional[vacation]'];
            }
          }

          //Delete temp values:
          delete personSaveData.doc_country_code;
          delete personSaveData.doc_type;
          delete personSaveData.document;
          delete personSaveData['phone_numbers[0]'];
          delete personSaveData['phone_numbers[1]'];
          delete userSaveData['professional[id]'];
          delete userSaveData['professional[description]'];
          delete userSaveData['professional[workload]'];
          delete userSaveData['professional[vacation]'];
          delete userSaveData['password_repeat'];

          //Check person_id and user_id with regex ObjectId:
          if(regexObjectId.test(this.person_id) === false){
            this.person_id = '';
          }

          if(regexObjectId.test(this.user_id) === false){
            this.user_id = '';
          }

          //Create observable Save Person:
          const obsSavePerson = this.sharedFunctions.saveRxJS(this.personOperation, 'people', this.person_id, personSaveData, this.personKeysWithValues);

          //Create observable Save User:
          const obsSaveUser = obsSavePerson.pipe(
            //Check first result (save person):
            map((res: any) => {
              //Check operation status:
              if(res.success === true){
                //Set fk_person in form user object with assigned _id:
                userSaveData['fk_person'] = res.data._id;
              }

              //Return response:
              return res;
            }),

            //Filter that only success cases continue:
            filter((res: any) => res.success === true),

            //Save user with the fk_person (Return observable):
            mergeMap(() => this.sharedFunctions.saveRxJS(this.userOperation, 'users', this.user_id, userSaveData, this.userKeysWithValues)),
          );

          //Observe content (Subscribe):
          obsSaveUser.subscribe({
            next: (res) => {
              //Response the form according to the result:
              this.sharedFunctions.formResponder(res, this.destiny, this.router);
            }
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
    this.sharedFunctions.gotoList(this.destiny, this.router);
  }

  setDefaultEmail(use_prefix: boolean = true){
    let prefix = '';

    //Check and set prefix:
    if(use_prefix){
      prefix = this.form.value.person.doc_country_code + '.' + this.form.value.person.doc_type + '.';
    }

    //Set default no email value:
    const defaultEmail = prefix + this.form.value.person.document + '@' + this.sharedProp.userLogged.permissions[0].description + '.com';
    this.form.get('user.email')?.setValue(defaultEmail);
  }

  async anonymizeUser(){
    //Set anonymized document:
    const anonymizedDocument = {
      doc_country_code  : this.sharedProp.mainSettings.appSettings.default_country,
      doc_type          : '100',
      document          : this.sharedFunctions.getObjectId()
    };

    //Set anonymized document in form fields:
    this.form.get('person.doc_country_code')?.setValue(anonymizedDocument.doc_country_code);
    this.form.get('person.doc_type')?.setValue(anonymizedDocument.doc_type);
    this.form.get('person.document')?.setValue(anonymizedDocument.document);

    //Set documents to see document section:
    this.documents = [anonymizedDocument];

    //Validate document to enable save button:
    this.validateDocument();

    //Set anonymized name and surname:
    this.form.get('person.name_01')?.setValue('ANÓNIMO');
    this.form.get('person.surname_01')?.setValue('ANÓNIMO');

    //Set gender:
    this.form.get('person.gender')?.setValue('3');

    //Set birth date (Default: today):
    this.form.get('person.birth_date')?.setValue(new Date());

    //Set anonymized phone (Any value: Fibonacci secuence):
    this.form.get('person.phone_numbers[0]')?.setValue('01123581321');

    //Set default email with anonymized document:
    this.setDefaultEmail(false);
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
