import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                               // Router
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { app_setting, document_types, ISO_3166 } from '@env/environment';               // Enviroment
import { map, mergeMap } from 'rxjs/operators';                                         // Reactive Extensions (RxJS)
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-check-person',
  templateUrl: './check-person.component.html',
  styleUrls: ['./check-person.component.css']
})
export class CheckPersonComponent implements OnInit {
  public settings: any = app_setting;
  public country_codes: any = ISO_3166;
  public document_types: any = document_types;

  //Initializate response and user_params objects:
  private response = {};
  private user_params = {};

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services, components and router to the constructor:
  constructor(
    public formBuilder: FormBuilder,
    private router: Router,
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Chequeo de personas',
      content_icon  : 'person_search',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('users');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      document          : ['', [Validators.required]],
      doc_country_code  : [ this.settings.default_country, [Validators.required]],
      doc_type          : [ this.settings.default_doc_type, [Validators.required]]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(){
    //Validate fields:
    if(this.form.valid){

      //Set people params:
      const people_params = {
        'filter[documents.document]' : this.form.value.document,
        'filter[documents.doc_country_code]' : this.form.value.doc_country_code,
        'filter[documents.doc_type]' : this.form.value.doc_type
      };

      //Create observable people:
      const obsPeople = this.sharedFunctions.findRxJS('people', people_params, true);

      //Create observable obsUser:
      const obsUser = obsPeople.pipe(
        //Check first result (find person) and set user params:
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
            //Check if user exists
            if(res.data[0].fk_person){
              //UPDATE PERSON AND USER:
              //Redirect to user form with update action and user _id:
              this.router.navigate(['/' + this.sharedProp.element + '/form/update/' + res.data[0]._id ]);
            } else {
              //UPDATE PERSON AND INSERT USER:
              //Redirect to user form with update-person action and person _id:
              this.router.navigate(['/' + this.sharedProp.element + '/form/update-person/' + res.data[0]._id ]);
            }

            console.log(res.data[0]);
          } else {
            //INSERT PERSON AND USER:
            //Redirect to user form with insert action:
            this.router.navigate(['/' + this.sharedProp.element + '/form/insert/' + this.form.value.doc_country_code + '|' + this.form.value.doc_type + '|' + this.form.value.document + '|']);
          }
        }
      });

    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

}
