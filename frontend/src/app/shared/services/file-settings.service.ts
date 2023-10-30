import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class FileSettingsService {
  // mainSettings property is duplicated in the most important services to avoid 
  // circular dependencies and the content is set in the app.component constructor.
  private fileSettingsURL : string = 'assets/main-settings.json';
  public  mainSettings    : any = {}

  //Inject services to the constructor:
  constructor(private http: HttpClient) { }

  loadFileSettings(): Observable<any> {
    return this.http.get(this.fileSettingsURL);
  }
}