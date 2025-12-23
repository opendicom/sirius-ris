import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { StatsService } from '@modules/stats/services/stats.service';                       // Stats Serice
import { I18nService } from '@shared/services/i18n.service';                                // I18n Service
import { Color, ScaleType } from '@swimlane/ngx-charts';                                    // NGX Color Scheme
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-stats-appointments',
  templateUrl: './stats-appointments.component.html',
  styleUrls: ['./stats-appointments.component.css']
})
export class StatsAppointmentsComponent implements OnInit {
  //Initialize appointmentsLocalResponse:
  public appointmentsStatsResponse: any = {};

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Initializate Charts datasets:
  public datasets: any = {
    flow_state            : [],
    urgency               : [],
    outpatient            : [],
    modality              : [],
    gender                : [],
    equipment             : [],
    procedure             : [],
    cancellation_reasons  : [],
    country               : [],
    state                 : [],
    referring             : [],
    reporting             : []
  };

  //Set Chart colors and color schemes:
  public gender_colors = [
    { name: this.i18n.instant('STATS.MALE'), value: '#05a3ff87' },
    { name: this.i18n.instant('STATS.FEMALE'), value: '#d53a9d87' },
    { name: this.i18n.instant('STATS.OTHERS'), value: 'var(--green-highlighted)' },
  ];

  public flow_states_colors = [
    { name: this.i18n.instant('STATS.COORDINATED'), value: 'var(--green-opaque)' },
    { name: this.i18n.instant('STATS.CANCELLED_SUSPENDED'), value: '#ff6e69d3' }
  ];

  public urgency_colors = [
    { name: this.i18n.instant('STATS.URGENT'), value: '#ff6f69' },
    { name: this.i18n.instant('STATS.COMMON'), value: '#607d8b' }
  ];

  public outpatient_colors = [
    { name: this.i18n.instant('STATS.INPATIENT'), value: '#ff6f69' },
    { name: this.i18n.instant('STATS.OUTPATIENT'), value: '#607d8b' }
  ];

  public proceduresColorScheme: Color = { 
    domain: ['#733ad5a9'], 
    group: ScaleType.Ordinal, 
    selectable: true, 
    name: 'Procedures', 
  };

  public equipmentColorScheme: Color = {
    domain: ['#607d8b'], 
    group: ScaleType.Ordinal, 
    selectable: true, 
    name: 'Equipments', 
  };

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Inject services to the constructor:
  constructor(
    public formBuilder      : FormBuilder,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public statsService     : StatsService,
    public i18n             : I18nService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Set Reactive Form (First time):
    this.setReactiveForm({
      fk_branch     : ['', [Validators.required]],
      range_start   : ['', [Validators.required]],
      range_end     : ['', [Validators.required]]
    });
  }

  ngOnInit(): void { }

  onSearch(){
    //Validate fields:
    if(this.form.valid){
      //Set params:
      let params: any = {
        'start_date'  : this.sharedFunctions.setDatetimeFormat(this.form.value.range_start).split('T')[0],
        'end_date'    : this.sharedFunctions.setDatetimeFormat(this.form.value.range_end).split('T')[0],
        'fk_branch'   : this.form.value.fk_branch
      };

      //Execute find stats:
      this.statsService.findStats(this.datasets, 'appointments', params, (response, dataset) => {
        this.appointmentsStatsResponse = response;
        this.datasets = dataset;
      });
    }
  }
}