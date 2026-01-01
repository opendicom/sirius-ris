import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                       // MatDialog Data
import { SharedPropertiesService } from '@shared/services/shared-properties.service';             // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';               // Shared Functions
import { ISO_3166 } from '@env/environment';                                                      // Enviroment
import { I18nService } from '@shared/services/i18n.service';                                      // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-delete-appointment-draft',
  templateUrl: './delete-appointment-draft.component.html',
  styleUrls: ['./delete-appointment-draft.component.css']
})
export class DeleteAppointmentDraftComponent implements OnInit {
  public country_codes      : any = ISO_3166;
  public documentTypesKeys  : string[] = ['1','2','3','4','5','6','7','100'];
  public formatted_datetime : any;

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService,
    public i18n: I18nService
  ) { }

  ngOnInit(): void {
    //Set start and end format:
    this.formatted_datetime = this.sharedFunctions.datetimeFulCalendarFormater(new Date(this.data.start), new Date(this.data.end));
  }

}
