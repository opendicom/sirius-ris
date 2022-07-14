import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';       // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { app_setting, document_types, ISO_3166 } from '@env/environment';               // Enviroment
import { map, mergeMap } from 'rxjs/operators';                                         // Reactive Extensions (RxJS)
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  public settings: any = app_setting;
  public country_codes: any = ISO_3166;
  public document_types: any = document_types;

  //Initializate response and user_params objects:
  private response: any = {};
  private user_params: any = {};

  //Initializate operations:
  public personOperation: string = 'insert';
  public userOperation: string = 'insert';

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
      'email'             : [ '', [Validators.required]],
      'phone_numbers[0]'  : [ '', [Validators.required]],

      //User fields:
      'password'                  : [ '', [Validators.required]],
      'password_repeat'           : [ '', [Validators.required]],
      'status'                    : [ 'true', []],
      'professional[id]'          : [ '', []],
      'professional[description]' : [ '', []],
      'professional[workload]'    : [ '', []],
      'professional[vacation]'    : [ 'false', []],
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

      //Get data (people and user):
      this.getData(people_params, 'document');
    } else {
      //Check prevent clear (selectionChange: doc_country_code and doc_type):
      if(preventClear == false){
        //Clear data to FormControl elements:
        this.clearFormFields();
      }
    }
  }

  onSetEmail(){
    //Check that the email field is not empty and there are no person data loaded:
    //name_01 es required field of people schema.
    if(this.form.value.email != '' && this.form.value.name_01 == ''){
      //Set people params:
      const people_params = {
        'filter[email]' : this.form.value.email
      };

      //Get data (people and user):
      this.getData(people_params, 'email');
    }
  }

  onSubmit(){
    console.log(this.form.value)
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  getData(params: any, originField: string): void {
    //Create observable people:
    const obsPeople = this.sharedFunctions.findRxJS('people', params, true);

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

            //Set operations
            this.personOperation = 'update';
            this.userOperation = 'update';

            //Set validation for password fields:

          //UPDATE PERSON AND INSERT USER:
          } else {
            //Clear data to FormControl elements:
            this.clearFormFields();

            //Send data to FormControl elements (Set only person fields):
            this.setPerson(res.data[0]);

            //Set operations:
            this.personOperation = 'update';
            this.userOperation = 'insert';

            //Set validation for password fields:
          }

        //INSERT PERSON AND USER:
        } else {
          //Clear data to FormControl elements:
          this.clearFormFields(true);

          //Set operations:
          this.personOperation = 'insert';
          this.userOperation = 'insert';

          //Set validation for password fields:

        }
      }
    });
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
      this.form.controls['email'].setValue(personData.email);
      this.form.controls['phone_numbers[0]'].setValue(personData.phone_numbers[0]);
      this.form.controls['birth_date'].setValue(new Date(personData.birth_date));
    }
  }

  setUser(userData: any = false): void {
    //Check user data:
    if(userData){
      //Send data to FormControl elements (Set user fields):
      this.form.controls['status'].setValue(`${userData.status}`); //Use back tip notation to convert string
      this.form.controls['professional[id]'].setValue(userData.professional.id);
      this.form.controls['professional[description]'].setValue(userData.professional.description);
      this.form.controls['professional[workload]'].setValue(userData.professional.workload);
      this.form.controls['professional[vacation]'].setValue(`${userData.professional.vacation}`); //Use back tip notation to convert string
    }
  }

  clearFormFields(preventClear: boolean = false){
    //Person fields:
    if(preventClear == false){
      this.form.controls['email'].setValue('');
      this.form.controls['document'].setValue('');
      this.form.controls['doc_country_code'].setValue(this.settings.default_country);
      this.form.controls['doc_type'].setValue(this.settings.default_doc_type.toString());
    }
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
}
