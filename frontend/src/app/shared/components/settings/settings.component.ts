import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  //Inject services to the constructor:
  constructor(public sharedProp: SharedPropertiesService) {
    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Configuración del sistema',
      content_icon  : 'settings',
      filters_form    : false,
    });
  }

  ngOnInit(): void {
  }

}