import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                        // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { utils, writeFileXLSX } from 'xlsx';                                                // SheetJS CE
import { Color, ScaleType } from '@swimlane/ngx-charts';
import {                                                                                    // Enviroments
  appointments_flow_states,
  gender_types
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-stats-appointments',
  templateUrl: './stats-appointments.component.html',
  styleUrls: ['./stats-appointments.component.css']
})
export class StatsAppointmentsComponent implements OnInit {
  //Set component properties:
  public appointmentsFS : any = appointments_flow_states;
  public gender_types   : any = gender_types;

  //Set references objects:
  public availableOrganizations: any;

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
    flow_state  : [],
    urgency     : [],
    outpatient  : [],
    modality    : [],
    gender      : [],
    equipment   : [],
    procedure   : []
  };

  //Set Chart colors (colorScheme):
  public gender_colors = [
    { name: "Macsulino", value: '#05a3ff87' },
    { name: "Femenino", value: '#d53a9d87' },
    { name: "Otros", value: '#05ffa187' },
  ];

  public flow_states_colors = [
    { name: "Coordinada", value: '#05ff9f87' },
    { name: "Cancelada-suspendida", value: '#ff6e69d3' }
  ];

  public urgency_colors = [
    { name: "Urgente", value: '#ff6f69' },
    { name: "Común", value: '#607d8b' }
  ];

  public outpatient_colors = [
    { name: "Internado", value: '#ff6f69' },
    { name: "Ambulatorio", value: '#607d8b' }
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
    public sharedFunctions  : SharedFunctionsService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Set Reactive Form (First time):
    this.setReactiveForm({
      fk_organization   : [''],
      range_start       : ['', [Validators.required]],
      range_end         : ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    //Get Logged User Information (Domain and domain type):
    const domain = this.sharedProp.userLogged.permissions[0].domain;
    const domainType = this.sharedProp.userLogged.permissions[0].type;

    //Find references:
    this.findReferences();

    //Set current organization (To filter stats):
    this.sharedFunctions.getLoggedOrganization(domain, domainType, (result) => {
      this.form.controls['fk_organization'].setValue(result);
    });
  }

  onSearch(){
    //Validate fields:
    if(this.form.valid){
      //Set params:
      let params: any = {
        'start_date' : this.sharedFunctions.setDatetimeFormat(this.form.value.range_start).split('T')[0],
        'end_date'   : this.sharedFunctions.setDatetimeFormat(this.form.value.range_end).split('T')[0],
      };

      //Only superuser can set stats organization (Other users set organization with RABC):
      if(this.sharedProp.userLogged.permissions[0].role === 1){
        params['fk_organization'] = this.form.value.fk_organization;
      }

      //Execute stats find:
      this.sharedFunctions.find('stats', params, async (res) => {
        //Check operation status:
        if(res.success === true){
          //Set data in local response:
          this.appointmentsStatsResponse = res.data;
          
          //Order result:
          await this.sortResult(this.appointmentsStatsResponse);

          //Set Charts datasets:
          await Promise.all(Object.keys(this.datasets).map(async key => {
            this.datasets[key] = await this.getDataSet(key)
          }));
        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage('Error al intentar obtener información: ' + res.message);
        }
      }, false, 'appointments', false);
    }
  }

  async sortResult(data: any){
    //Sort results by keys (await foreach):
    await Promise.all(Object.keys(data).map(async key => {
      //Exclude total items and sort:
      if(key !== 'total_items'){
        data[key] = Object.fromEntries(Object.entries(data[key]).sort());
      }
    }));
  }
  
  async getDataSet(chart_name: string){
    //Initializate dataset:
    let current_dataset: any = [];
  
    //Loop in response object (await foreach):
    await Promise.all(Object.keys(this.appointmentsStatsResponse).map(async key => {
      //Check chart name:
      if(key == chart_name){
        //Add current element in current dataset (await foreach):
        await Promise.all(Object.keys(this.appointmentsStatsResponse[key]).map(async element_key => {
          //Initialize key_name:
          let key_name = element_key;

          //Change key names:
          switch(key){
            case 'flow_state':
              key_name = this.appointmentsFS[element_key];
              break;

            case 'urgency':
              key_name = element_key == 'true' ? 'Urgente' : 'Común';
              break;

            case 'outpatient':
              key_name = element_key == 'true' ? 'Ambulatorio' : 'Internado';
              break;

            case 'gender':
              key_name = this.gender_types[element_key];
              break;
          }

          //Add current element in dataset:
          current_dataset.push({ name: key_name, value: this.appointmentsStatsResponse[key][element_key]});
        }));
      }
    }));
  
    //Return current dataset:
    return current_dataset;
  }

  async jsonToXLSX(){
    //Create workbook:
    const workbook = utils.book_new();

    //Create worksheets with datasets:
    await Promise.all(Object.keys(this.datasets).map(async key => {
      //Create worksheet:
      const worksheet = utils.json_to_sheet(this.datasets[key]);

      //Append current sheet to workbook:
      utils.book_append_sheet(workbook, worksheet, key);
    }));

    //Download .XLSX file:
    //writeFile(workbook, "stats.xlsx");
    writeFileXLSX(workbook, 'stats.xlsx');
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