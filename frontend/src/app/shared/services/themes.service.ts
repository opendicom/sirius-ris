import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                                   // Router
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class ThemesService {
  //Inject services, components and router to the constructor:
  constructor(
    private router          : Router,
    private sharedFunctions : SharedFunctionsService
  ) { }

  switchTheme(theme: 'light' | 'dark', setInDB: boolean = false) {
    // Body:
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${theme}-theme`);

    // Check sirius settings in local file:
    if(localStorage.getItem('sirius_settings')){
      //Get encoded local file content:
      let objSettings: any = localStorage.getItem('sirius_settings');

      //Parse sirius settings object:
      objSettings = JSON.parse(objSettings);

      //Set current theme:
      objSettings['theme'] = theme;

      // Set current theme local file:
      localStorage.setItem('sirius_settings', JSON.stringify(objSettings));
    } else {
      //Set current theme:
      const objSettings = { theme: theme };

      // Set current theme local file:
      localStorage.setItem('sirius_settings', JSON.stringify(objSettings));
    }

    //SetInDB allows saving to the DB only in cases of topic changes, not initialization:
    if(setInDB){
      //Update user settings:
      this.sharedFunctions.updateUserSettings({ theme: theme });
    }
  }

  initializeTheme(force: any = null){
    //Check force value:
    if(force !== null){
      this.switchTheme(force);
    } else {
      // Check sirius settings in local file:
      if(localStorage.getItem('sirius_settings')){
        //Get encoded local file content:
        let objSettings: any = localStorage.getItem('sirius_settings');

        //Parse sirius settings object:
        objSettings = JSON.parse(objSettings);

        //Check objSettings properties:
        if(objSettings.theme !== undefined && objSettings.theme !== null && objSettings.theme !== ''){
          //Set theme:
          this.switchTheme(objSettings.theme);
        } else {
          this.switchTheme('dark');
        }
      } else {
        this.switchTheme('dark');
      }
    }
  }
}