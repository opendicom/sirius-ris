import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormBuilder, FormGroup, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { AppointmentsService } from '@modules/appointments/services/appointments.service';  // Appointments Service (reporting user helpers)
import { I18nService } from '@shared/services/i18n.service';                                // I18n Service
import { ISO_3166 } from '@env/environment';                                                // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-reporting-assignment',
  templateUrl: './reporting-assignment.component.html',
  styleUrls: ['./reporting-assignment.component.css']
})
export class ReportingAssignmentComponent implements OnInit {
  //Set component properties:
  public country_codes  : any = ISO_3166;
  public hasSearched     : boolean = false;
  public originalData    : any[] = [];
  public availableReportingUsers : any[] = [];
  private availableFlowStates    : string[] = ['P06', 'P07', 'P08'];

  //Initialize avalable references:
  public availableOrganizations : any = {};
  public availableBranches      : any = {};

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'flow_state',
    'date',
    'report_control',
    'documents',
    'names',
    'surnames',
    'details',
    'outpatient_inpatient',
    'urgency',
    'reporting_user'
  ];

  
  public form!: FormGroup;

  //Inject services to the constructor:
  constructor(
    public formBuilder         : FormBuilder,
    public sharedFunctions     : SharedFunctionsService,
    public appointmentsService : AppointmentsService,
    private i18n               : I18nService
  ) {
    
    this.form = this.formBuilder.group({
      fk_branch: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    
    this.findReferences();
  }

  onSearch(): void {
    //Validate fields:
    if(!this.form.valid){
      return;
    }

    //Set reporting users params 
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

    //Set performing params (Only P06, P07, P08 studies in the selected branch):
    const performingParams = {
      'filter[and][appointment.imaging.branch._id]': this.form.value.fk_branch,
      'filter[in][flow_state]'                      : this.availableFlowStates,
      'sort[date]'                                  : -1
    };

    this.sharedFunctions.findRxJS('users', reportingUsersParams, false, 'findByBranch', false).subscribe((resUsers: any) => {
      //Check operation status:
      if(resUsers.success === true){
        this.availableReportingUsers = resUsers.data;

        //Find studies:
        this.sharedFunctions.find('performing', performingParams, (resPerforming: any) => {
          //Check operation status:
          if(resPerforming.success === true){
            //Find the authenticated ones 
            this.sharedFunctions.getAuthenticated(resPerforming.data);

            //Set per-row assignment state (Selected reporting users and search input):
            resPerforming.data.forEach((study: any) => {
              study.reportingUserIds     = this.getAssignedReportingUserIds(study);
              study.reportingUserInput   = '';
              study.savingReportingUsers = false;
            });

            //Preserve original data for sortTable's revert to unsorted case:
            this.originalData = [...this.sharedFunctions.response.data];
          }

          this.hasSearched = true;
        }, false, false, true);
      }
    });
  }

  findReferences(): void {
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

  
  matchesReportingUserFilter(study: any, currentReporting: any): boolean {
    
    if(!study.reportingUserInput){ return true; }

   
    return this.appointmentsService.getReportingUserFullName(currentReporting).toUpperCase().includes(study.reportingUserInput.toUpperCase());
  }

  saveReportingUsers(study: any): void {
    //Guard: an appointment reference is required to save:
    if(!study.appointment || !study.appointment._id){ return; }

    study.savingReportingUsers = true;

    //Save data (Same 'appointments' update endpoint used by performing/form and appointments/form-update):
    this.sharedFunctions.save('update', 'appointments', study.appointment._id, this.getAppointmentSaveData(study.appointment, study.reportingUserIds), [], (res: any) => {
      study.savingReportingUsers = false;

      //Check operation status :
      if(res.success === true){
        this.sharedFunctions.sendMessage(res.message || this.i18n.instant('SHARED.SAVE_SUCCESS_MESSAGE'), { duration: 2000 });
      } else {
        this.sharedFunctions.sendMessage(res.message);
      }
    }, false);
  }

  private getAssignedReportingUserIds(study: any): string[] {
    return (study.appointment?.reporting?.fk_reporting || []).map((currentReporting: any) => typeof currentReporting === 'string' ? currentReporting : currentReporting._id);
  }

  private getAppointmentSaveData(appointment: any, reportingUserIds: string[]): any {
    //Populated lookups as plain ObjectIds:
    const getId = (value: any) => typeof value === 'object' ? value?._id : value;

    return {
      ...appointment,
      imaging: {
        ...appointment.imaging,
        organization : getId(appointment.imaging.organization),
        branch       : getId(appointment.imaging.branch),
        service      : getId(appointment.imaging.service)
      },
      referring: {
        ...appointment.referring,
        organization : getId(appointment.referring.organization),
        branch       : getId(appointment.referring.branch),
        service      : getId(appointment.referring.service),
        fk_referring : getId(appointment.referring.fk_referring)
      },
      reporting: {
        ...appointment.reporting,
        organization : getId(appointment.reporting.organization),
        branch       : getId(appointment.reporting.branch),
        service      : getId(appointment.reporting.service),
        fk_reporting : reportingUserIds
      },
      fk_patient: getId(appointment.fk_patient)
    };
  }
}
