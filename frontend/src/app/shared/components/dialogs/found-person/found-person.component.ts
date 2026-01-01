import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                       // MatDialog Data
import { SharedPropertiesService } from '@shared/services/shared-properties.service';             // Shared Properties
import { ISO_3166 } from '@env/environment';                                                      // Enviroment
import { I18nService } from '@shared/services/i18n.service';                                      // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-found-person',
  templateUrl: './found-person.component.html',
  styleUrls: ['./found-person.component.css']
})
export class FoundPersonComponent implements OnInit {
  public country_codes    : any = ISO_3166;
  public documentTypesKeys: string[] = ['1','2','3','4','5','6','7','100'];

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data:
    public sharedProp: SharedPropertiesService,
    public i18n: I18nService
  ) { }

  ngOnInit(): void {
  }

}
