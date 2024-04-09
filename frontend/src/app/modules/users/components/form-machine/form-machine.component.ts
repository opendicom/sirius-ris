import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                     // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                          // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';         // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';           // Shared Functions
import { UsersService } from '@modules/users/services/users.service';                         // User Services
import { user_roles, user_concessions } from '@env/environment';                              // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form-machine',
  templateUrl: './form-machine.component.html',
  styleUrls: ['./form-machine.component.css']
})
export class FormMachineComponent implements OnInit {
  public userRoles        : any = user_roles;
  public userConcessions  : any = user_concessions;

  //Create unsorted function to prevent Angular from sorting 'wrong' ngFor keyvalue:
  unsorted = () => { return 0 }

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableServices      : any;

  //Initializate response & params objects:
  public  user_data     : any = {};

  //Initialize complex objects:
  public  permissions   : any[] = [];

  //Initializate validation tab errors:
  public userTabErrors        : boolean = false;
  public permissionTabErrors  : boolean = false;

  //Initializate selected concession:
  public selectedConcession : number[] = [];

  //Initializate operations:
  public userOperation    : string = 'insert';

  //Re-define method in component to use in HTML view:
  public getKeys  : any;
  public getMath  : any = Math;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public user_id                : string = '';
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
    public  userService     : UsersService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de usuarios máquina',
      content_icon  : 'smart_toy',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('users');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      //User fields:
      user: this.formBuilder.group({
        'username'                  : [ '', [Validators.required]],
        'password'                  : [ '', [Validators.required]],
        'password_repeat'           : [ '', [Validators.required]],
        'status'                    : [ 'true', []],
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

    //Get data from the DB (form_action):
    if(this.form_action == 'update'){
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

          //Check operation status:
          if(res.success === true && res.data.length > 0){
            //Clear data to FormControl elements:
            this.clearFormFields();

            //Send data to FormControl elements:
            this.user_id = this.userService.setUser(res.data[0], this.user_id, this.form);

            //Set current permissions:
            this.permissions = res.data[0].permissions;

            //Remove validator required in passwords field:
            this.form.get('user.password')?.clearValidators();
            this.form.get('user.password_repeat')?.clearValidators();
            this.form.get('user.password')?.updateValueAndValidity();
            this.form.get('user.password_repeat')?.updateValueAndValidity();

            //Set operations
            this.userOperation = 'update';

            //Get property keys with values:
            this.userKeysWithValues = this.sharedFunctions.getKeys(this.form.value.user, false, true);

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + res.message);
            this.router.navigate(['/' + this.sharedProp.element + '/list']);
          }
        });
      }
    }
  }

  onSetUsername(){
    //Check username field content:
    if(this.form.value.user.username != ''){
      const params = {
        'filter[username]' : this.form.value.user.username,
        'proj[password]'  : 0
      }

      //Find element to update:
      this.sharedFunctions.find(this.sharedProp.element, params, (res) => {
        //Check operation status:
        if(res.success === true && res.data.length > 0){
          //Clear data to FormControl elements:
          this.clearFormFields(true);

          //Send data to FormControl elements:
          this.user_id = this.userService.setUser(res.data[0], this.user_id, this.form);

          //Set current permissions:
          this.permissions = res.data[0].permissions;

          //Remove validator required in passwords field:
          this.form.get('user.password')?.clearValidators();
          this.form.get('user.password_repeat')?.clearValidators();
          this.form.get('user.password')?.updateValueAndValidity();
          this.form.get('user.password_repeat')?.updateValueAndValidity();

          //Set operations
          this.userOperation = 'update';

          //Get property keys with values:
          this.userKeysWithValues = this.sharedFunctions.getKeys(this.form.value.user, false, true);
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
          this.userOperation = 'insert';
        }
      }, true);
    }
  }

  clearFormFields(preventClear: boolean = false){
    //Clear _ids:
    this.user_id = '';

    //Clear complex objects:
    this.permissions = [];

    //Person fields:
    if(preventClear == false){
      this.form.get('user.username')?.setValue('');
    }

    //User fields:
    this.form.get('user.status')?.setValue('true');
    this.form.get('user.password')?.setValue('');
    this.form.get('user.password_repeat')?.setValue('');
  }

  onCheckConcession(event: any, key: any){
    //Set concession:
    this.selectedConcession = this.userService.setConcession(event, key, this.selectedConcession);
  }

  onSubmit(){
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
      //Validate fields:
      if(this.form.valid){
        //Check permissions:
        if(this.permissions.length > 0){
          //Create save object to preserve data types in form.value (Clone objects with spread operator):
          let userSaveData = { ...this.form.value.user} ;

          //Data normalization - Booleans types (mat-option cases):
          if(typeof userSaveData.status != "boolean"){ userSaveData.status = userSaveData.status.toLowerCase() == 'true' ? true : false; }

          //Data normalization - Set permissions in form user object:
          userSaveData['permissions'] = this.permissions;

          //Create observable Save User:
          const obsSaveUser = this.sharedFunctions.saveRxJS(this.userOperation, 'users', this.user_id, userSaveData, this.userKeysWithValues);

          //Observe content (Subscribe):
          obsSaveUser.subscribe({
            next: (res) => {
              //Response the form according to the result:
              this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
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
