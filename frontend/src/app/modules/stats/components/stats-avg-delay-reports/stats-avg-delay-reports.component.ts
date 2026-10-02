import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { StatsService } from '@modules/stats/services/stats.service';                       // Stats Serice
import { I18nService } from '@shared/services/i18n.service';                                // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-stats-avg-delay-reports',
  templateUrl: './stats-avg-delay-reports.component.html',
  styleUrls: ['./stats-avg-delay-reports.component.css']
})
export class StatsAvgDelayReportsComponent implements OnInit {
  //Initialize avgDelayReportsStatsResponse:
  public avgDelayReportsStatsResponse: any = {};

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Initializate Charts datasets:
  public datasets: any = {
    modalities  : []
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
      this.statsService.findStats(this.datasets, 'avg-delay-reports', params, (response, dataset) => {
        this.avgDelayReportsStatsResponse = response;
        this.datasets = dataset;
      });
    }
  }
}
