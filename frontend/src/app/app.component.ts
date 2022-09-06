import { Component } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sirius-ris';

  //Inject services to the constructor (Create first actionProp):
  constructor(public sharedProp: SharedPropertiesService) { }

  // Fix FullCalendar bug first Render:
  fixFullCalendar(){
    // Fix info:
    // https://github.com/fullcalendar/fullcalendar/issues/4976
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 250);
  }
}
