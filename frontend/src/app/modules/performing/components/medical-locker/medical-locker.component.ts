import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { map } from 'rxjs/operators';                                                   // Reactive Extensions (RxJS)
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-medical-locker',
  templateUrl: './medical-locker.component.html',
  styleUrls: ['./medical-locker.component.css']
})
export class MedicalLockerComponent implements OnInit {
  //Initialize local properties:
  public reportingUsersLocalResponse  : any = {};
  public performingLocalResponse      : any = {};

  //Initialize avalable references:
  public availableOrganizations : any = {};
  public availableBranches      : any = {};

  //Set visible columns of the list:
  public displayedColumns: string[] = ['reports', 'total'];
  public availableFlowStates: any[] = ['P06', 'P07', 'P08'];
  
  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Inject services to the constructor:
  constructor(
    public formBuilder      : FormBuilder,
    private i18n            : I18nService,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : i18n.instant('MEDICAL_LOCKER.CONTENT_TITLE'),
      content_icon        : 'all_inbox',
      add_button          : false,
      duplicated_surnames : false,                          // Check duplicated surnames
      nested_element      : false,                          // Set nested element
      filters_form        : false,
      advanced_search     : false
    });

    //Set Reactive Form (First time):
    this.setReactiveForm({
      fk_branch     : ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    //Find references:
    this.findReferences();
  }

  onSearch(){
    //Validate fields:
    if(this.form.valid){
      //Set reporting users params:
      const reportingUsersParams = {
        //Only people users:
        'filter[person.name_01]': '',
        'regex': true,

        //Only selected role users in selected branch, current branch and current organization (findByBranch):
        'branch': this.form.value.fk_branch,
        'role': '4',  //Only pysicians (Role 4 in users collection)

        //Exclude users with vacation true:
        'filter[professional.vacation]': false,

        //Only enabled users:
        'filter[status]': true,

        //Projection:
        'proj[password]': 0,
        'proj[permissions]': 0,
        'proj[settings]': 0
      };

      //Set performing params:
      const performingParams = {
        'fk_branch': this.form.value.fk_branch,
      };

      //Create obsLocker:
      const obsLocker = this.sharedFunctions.findRxJS('users', reportingUsersParams, false, 'findByBranch', false).pipe(
        //Check first result (find by branch):
        map((res: any) => {
          //Check operation status:
          if(res.success === true){
            this.reportingUsersLocalResponse = res.data;

            //Find lockers:
            this.sharedFunctions.find('performing', performingParams, (res) => {
              //Check operation status:
              if(res.success === true){
                this.performingLocalResponse = this.formatResult(res.data, this.reportingUsersLocalResponse);
              }
            }, false, 'findLockers', false);
          }
    
          //Return response:
          return res;
        })
      );

      //Observe content (Subscribe):
      obsLocker.subscribe();
    }
  }

  findReferences(){
    //Set params:
    const params = { 'filter[status]': true };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.availableOrganizations = res.data;
    });

    //Find branches:
    this.sharedFunctions.find('branches', params, (res) => {
      this.availableBranches = res.data;
    });
  }

  formatResult(performingReports: any, reportingUsers: any[]) {
    // Initialize all users with empty states and then fill with real data:
    const acc: any = reportingUsers.reduce((map: any, user: any) => {
      map[user._id] = {
        _id: user._id,
        complete_name: `${user.person?.name_01} ${user.person?.surname_01}`.toUpperCase(),
        assigned_reports: this.availableFlowStates.reduce((statesAcc: any, state: string) => {
          statesAcc[state] = [];
          return statesAcc;
        }, {})
      };

      return map;
    }, {});

    // Fill users with real data:
    performingReports.forEach((item: any) => {
      const reportingIds = item.appointment?.reporting?.fk_reporting || [];

      reportingIds.forEach((repId: string) => {
        const flow = item.flow_state;

        acc[repId].assigned_reports[flow].push({
          _id: item._id,
          urgency: item.urgency
        });
      });
    });

    return Object.values(acc);
  }

  countUrgencies(assigned_reports: any): number {
    return assigned_reports.filter((current: any) => current.urgency).length;
  }
}