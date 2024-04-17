import { Component, OnInit } from '@angular/core';

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
  regexObjectId,
  gender_types
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-set-patient',
  templateUrl: './set-patient.component.html',
  styleUrls: ['./set-patient.component.css']
})
export class SetPatientComponent implements OnInit {
  public country_codes    : any = ISO_3166;
  public document_types   : any = document_types;
  public genderTypes      : any = gender_types;

  //Create unsorted function to prevent Angular from sorting 'wrong' ngFor keyvalue:
  unsorted = () => { return 0 }

  //Set references objects:
  public availableOrganizations: any;

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
  public genderCheckErrors    : boolean = false;

  //Initializate operations:
  public personOperation  : string = 'insert';
  public userOperation    : string = 'insert';

  //Initializate validation document vars:
  public registered_doc_type  : boolean = false;
  public validation_result    : boolean = false;
  public disabled_save_button : boolean = true;

  //Set appointment_request flag:
  public appointment_request    : any;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

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
      content_title : 'Paso 01 - Chequeo de datos del paciente',
      content_icon  : 'hotel',
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
        'password'          : [ '', [Validators.required]],
        'password_repeat'   : [ '', [Validators.required]],
        'email'             : [ '', [Validators.required]],
        'status'            : [ 'true', []],

        //Patient organization input (Only Superuser):
        'organization'        : [ '', [Validators.required]],
      })
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.appointment_request = this.objRoute.snapshot.params['appointment_request'];

    //Check appointment_request:
    this.checkAppointmentRequest();

    //Find references:
    this.findReferences();

    //Clear previous friendly passwords:
    this.sharedProp.current_friendly_pass = '';

    //Get Logged User Information (Domain and domain type):
    const domain = this.sharedProp.userLogged.permissions[0].domain;
    const domainType = this.sharedProp.userLogged.permissions[0].type;

    //Set current organization (To be able to add patients permissions):
    this.sharedFunctions.getLoggedOrganization(domain, domainType, (result) => {
      //Set organization in shared properties:
      this.sharedProp.current_organization = result;

      //Set organization input value (FormControl):
      this.form.get('user.organization')?.setValue(result);
    });
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

  onSetDocument(preventClear: boolean = false, callback = (res: any) => {}){
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

              //Set friendly password for the user:
              this.sharedProp.current_friendly_pass = this.sharedFunctions.getFriendlyPass();
              this.form.get('user.password')?.setValue(this.sharedProp.current_friendly_pass);
              this.form.get('user.password_repeat')?.setValue(this.sharedProp.current_friendly_pass);

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

            //Set friendly password for the user:
            this.sharedProp.current_friendly_pass = this.sharedFunctions.getFriendlyPass();
            this.form.get('user.password')?.setValue(this.sharedProp.current_friendly_pass);
            this.form.get('user.password_repeat')?.setValue(this.sharedProp.current_friendly_pass);

            //Set operations:
            this.personOperation = 'insert';
            this.userOperation = 'insert';
          }

          //Execute callback:
          callback(res);
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
  }

  async onSubmit(){
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
        //Create save object to preserve data types in form.value (Clone objects with spread operator):
        let personSaveData = { ...this.form.value.person };
        let userSaveData = { ...this.form.value.user} ;

        //Data normalization - Booleans types (mat-option cases):
        if(typeof userSaveData.status != "boolean"){ userSaveData.status = userSaveData.status.toLowerCase() == 'true' ? true : false; }

        //Data normalization - Dates types:
        personSaveData.birth_date = this.sharedFunctions.setDatetimeFormat(this.form.value.person.birth_date);

        //Data normalization - Set documents in form person object:
        personSaveData['documents'] = this.documents;

        //Initialize patientAlreadyExist:
        let patientAlreadyExist = false;

        //Set current organization with organization input (Superuser manipulation case):
        this.sharedProp.current_organization = userSaveData.organization;

        //Add patient permission if it doesn't already exist (Await foreach):
        await Promise.all(Object.keys(this.permissions).map((key) => {
          //If permision domain (type 'organization') equal to current_organization and role patient:
          if(this.permissions[parseInt(key, 10)].organization == this.sharedProp.current_organization && parseInt(this.permissions[parseInt(key, 10)].role, 10) === 9){
            patientAlreadyExist = true;
          }
        }));

        //Add patient permission if it doesn't already exist:

        if(patientAlreadyExist === false){
          this.permissions.push({ "role": 9, "organization": this.sharedProp.current_organization });
        }

        //Data normalization - Set permissions in form user object:
        userSaveData['permissions'] = this.permissions;

        //Data normalization - Phone numbers to array:
        personSaveData['phone_numbers'] = [];
        personSaveData['phone_numbers'].push(personSaveData['phone_numbers[0]']);
        if(personSaveData['phone_numbers[1]'] != undefined && personSaveData['phone_numbers[1]'] != '') { personSaveData['phone_numbers'].push(personSaveData['phone_numbers[1]']); }

        //Delete temp values:
        delete personSaveData.doc_country_code;
        delete personSaveData.doc_type;
        delete personSaveData.document;
        delete personSaveData['phone_numbers[0]'];
        delete personSaveData['phone_numbers[1]'];

        //Check person_id and user_id with regex ObjectId:
        if(regexObjectId.test(this.person_id) === false){
          this.person_id = '';
        }

        if(regexObjectId.test(this.user_id) === false){
          this.user_id = '';
        }

        //Initialize _id saved user:
        let savedUserID: string | null = null;

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

          //Check second result (save user):
          map((res: any) => {
            //Check operation status:
            if(res.success === true){
              savedUserID = res.data._id;
            }

            //Return response:
            return res;
          }),

          //Filter that only success cases continue and there is user _id in the request:
          filter((res: any) => res.success === true && res.data._id),

          //Search inserted user to get information of the person from the aggregation lookup (Return observable):
          mergeMap(() => this.sharedFunctions.findRxJS('users', { 'filter[_id]': savedUserID })),
        );

        //Observe content (Subscribe):
        obsSaveUser.subscribe({
          next: (res) => {
            //Set current_patient object in sharedProperties service:
            this.sharedProp.current_patient = res.data[0];

            //Check appointment request:
            if(this.appointment_request !== undefined && this.sharedFunctions.stringToBoolean(this.appointment_request) && this.sharedProp.current_appointment_request !== undefined){
              //Redirect to select procedure form (Preserve activate route field):
              this.router.navigate(['/appointments/select_procedure/true']);
            } else {
              //Redirect to select procedure form:
              this.router.navigate(['/appointments/select_procedure']);
            }
          }
        });

      }
    } else {
      this.userTabErrors = true;

      //Send message:
      this.sharedFunctions.sendMessage('Las contraseñas ingresadas no coinciden entre si.');
    }
  }

  checkAppointmentRequest(){
    if(this.appointment_request !== undefined && this.sharedFunctions.stringToBoolean(this.appointment_request) && this.sharedProp.current_appointment_request !== undefined){
      //Set patient data with appointment request data:
      if(this.sharedProp.current_appointment_request.hasOwnProperty('patient')){
        this.form.get('person.document')?.setValue(this.sharedProp.current_appointment_request.patient.document);
        this.form.get('person.doc_type')?.setValue(this.sharedProp.current_appointment_request.patient.doc_type.toString());

        if(this.sharedProp.current_appointment_request.patient.hasOwnProperty('doc_country_code')){
          this.form.get('person.doc_country_code')?.setValue(this.sharedProp.current_appointment_request.patient.doc_country_code);
        }

        //On set document to validate document and find person and user:
        this.onSetDocument(false, (res) => {
          //Check response:
          //If user exist in DB preserve local data:
          if(Object.keys(res).length > 0){
            //Send snakbar message:
            this.sharedFunctions.sendMessage('Datos cargados desde la base de datos local por coincidencia de documento.', { duration : 2000 });

          //If user doesn't exist, set appointment request patient data:
          } else {
            this.form.get('person.name_01')?.setValue(this.sharedProp.current_appointment_request.patient.name_01);
            this.form.get('person.name_02')?.setValue(this.sharedProp.current_appointment_request.patient.name_02);
            this.form.get('person.surname_01')?.setValue(this.sharedProp.current_appointment_request.patient.surname_01);
            this.form.get('person.surname_02')?.setValue(this.sharedProp.current_appointment_request.patient.surname_02);
            this.form.get('person.gender')?.setValue(this.sharedProp.current_appointment_request.patient.gender.toString());
            this.form.get('person.phone_numbers[0]')?.setValue(this.sharedProp.current_appointment_request.patient.phone_numbers[0]);
            
            if(this.sharedProp.current_appointment_request.patient.phone_numbers[1]){
              this.form.get('person.phone_numbers[1]')?.setValue(this.sharedProp.current_appointment_request.patient.phone_numbers[1]);
            }
            
            this.form.get('person.birth_date')?.setValue(new Date(this.sharedProp.current_appointment_request.patient.birth_date.split('T')[0].replace(/-/g, '/')));
            
            //Patient email -> Specified only in Sirius Web Module:
            this.form.get('user.email')?.setValue(this.sharedProp.current_appointment_request.patient.email);
            //Check email in DB:
            this.onSetEmail();
          }
        });
      }
    }
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

    //On set document to enable save button:
    this.onSetDocument(true, () => {
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
    });
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList('appointments', this.router);
  }

  findReferences(){
    //Set params:
    const params = { 'filter[status]': true };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.availableOrganizations = res.data;
    });
  }
}
