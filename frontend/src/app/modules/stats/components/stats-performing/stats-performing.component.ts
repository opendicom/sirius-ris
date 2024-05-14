import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { StatsService } from '@modules/stats/services/stats.service';                       // Stats Serice
import { Color, ScaleType } from '@swimlane/ngx-charts';                                    // NGX Color Scheme
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-stats-performing',
  templateUrl: './stats-performing.component.html',
  styleUrls: ['./stats-performing.component.css']
})
export class StatsPerformingComponent implements OnInit {
  //Initialize performingLocalResponse:
  public performingLocalResponse: any = {};

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
    modality              : [],
    gender                : [],
    equipment             : [],
    procedure             : [],
    cancellation_reasons  : [],
    country               : [],
    state                 : [],
    injection_user        : [],
    laboratory_user       : [],
    console_technician    : [],
    referring             : [],
    reporting             : []
  };

  //Set Chart colors and color schemes:
  public gender_colors = [
    { name: "Macsulino", value: '#05a3ff87' },
    { name: "Femenino", value: '#d53a9d87' },
    { name: "Otros", value: '#05ffa187' },
  ];

  public flow_states_colors = [
    { name: "Recepción", value: '#607d8b87' },
    { name: "Entrevista", value: '#607d8b87' },
    { name: "Preparación/Inyección", value: '#607d8b87' },
    { name: "Adquisición", value: '#607d8b87' },
    { name: "Verificación de imágenes", value: '#607d8b87' },
    { name: "Para informar", value: '#607d8b87' },
    { name: "Informe borrador", value: '#d53a9cc9' },
    { name: "Informe firmado", value: '#733ad5a9' },
    { name: "Terminado (con informe)", value: '#05ff9f87' },
    { name: "Terminado (sin informe)", value: '#05ff9f87' },
    { name: "Cancelado", value: '#ff6e69d3' },
  ];

  public urgency_colors = [
    { name: "Urgente", value: '#ff6f69' },
    { name: "Común", value: '#607d8b' }
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
    public statsService     : StatsService
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
      this.statsService.findStats(this.datasets, 'performing', params, (response, dataset) => {
        this.performingLocalResponse = response;
        this.datasets = dataset;
      });
    }
  }
}
