import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                 // MatDialog Data
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { ISO_3166, objectKeys } from '@env/environment';                                    // Enviroment
import { I18nService } from '@shared/services/i18n.service';                                // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-patient-details',
  templateUrl: './patient-details.component.html',
  styleUrls: ['./patient-details.component.css']
})
export class PatientDetailsComponent implements OnInit {
  public country_codes    : any = ISO_3166;
  public documentTypesKeys: string[] = objectKeys.documentTypesKeys;

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data:
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public i18n             : I18nService
  ) { }

  ngOnInit(): void {
  }

}
