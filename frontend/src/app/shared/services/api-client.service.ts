import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpClient, HttpEventType } from '@angular/common/http';               // HTTPClient and HttpEventType
import { Observable } from 'rxjs';                                              // Reactive Extensions (RxJS)
import { FileSettingsService } from '@shared/services/file-settings.service';   // File Settings Service
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  //Set backend URL:
  private backend_url   : string = '';
  private file_max_size : number | undefined;

  //Inject services to the constructor:
  constructor(private http: HttpClient, private fileSettingsService: FileSettingsService) {
    //Load file settings properties manually (Cannot use public mainSettings properties to avoid circular dependencies):
    this.fileSettingsService.loadFileSettings().subscribe((settings: any) => {
      this.backend_url = settings.appSettings.backend_url;
      this.file_max_size = settings.appSettings.file_max_size;
    });
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // SEND REQUEST:
  //--------------------------------------------------------------------------------------------------------------------//
  sendRequest(method: string, path: string, data: any): Observable<any> {
    //Initialize response object:
    let response: any;

    //Set method:
    switch(method){
      case 'GET':
        response = this.http.get(this.backend_url + path, { params: data });
        break;
      case 'POST':
        response = this.http.post(this.backend_url + path, data);
        break;
    }

    //Return response:
    return response;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SEND FILE REQUEST:
  //--------------------------------------------------------------------------------------------------------------------//
  sendFileRequest(path: string, selectedFile: any, organization: string, branch: string, name: string | undefined = undefined): Observable<any>{
    //Create multipart form:
    const multipartForm = new FormData();

    //Set multipart form values:
    multipartForm.append('domain[organization]', organization);
    multipartForm.append('domain[branch]', branch);
    multipartForm.append('uploaded_file', selectedFile, selectedFile.name);

    //Check name:
    if(name === undefined && name !== '' || name === 'attached_files'){
      multipartForm.append('name', selectedFile.name);
    } else {
      //Get extension file:
      const extFile = selectedFile.name.split('.').pop();

      //Set name with original extension:
      multipartForm.append('name', name + '.' + extFile);
    }

    //Return Observable:
    return new Observable<any>((observer) => {
      //Check max file size:
      if(this.file_max_size !== undefined && this.bytesToMegaBytes(selectedFile.size) <= this.file_max_size){
        //Send POST request (multipart form):
        this.http.post(this.backend_url + path, multipartForm, {
          //Set headers:
          reportProgress: true,
          observe: 'events'

        //Observe content (Subscribe):
        }).subscribe((event: any) => {
          if(event.type === HttpEventType.UploadProgress){
            //Pass chunks of data between observables (report progress):
            observer.next({ operation_status: 'uploading', progress: Math.round(event.loaded / event.total * 100) });
          } else if(event.type === HttpEventType.Response){
            //Return response:
            observer.next({ operation_status: 'finished', server_response: event });
          }
        });
      } else{
        //Remove multipart form values:
        multipartForm.delete('domain[organization]');
        multipartForm.delete('domain[branch]');
        multipartForm.delete('name');
        multipartForm.delete('uploaded_file');

        //Send cancelation message:
        observer.next({ operation_status: 'cancelled', message: 'El archivo que seleccióno excede el límite de tamaño máximo permitido (' + this.file_max_size + ' MB).' });
      }

    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // BYTE TO MEGA BYTES:
  // Duplicated method to prevent circular dependency - [Duplicated method: shared-functions.service].
  //--------------------------------------------------------------------------------------------------------------------//
  bytesToMegaBytes(bytes: any): any {
    return bytes / (1024*1024);
  }
  //--------------------------------------------------------------------------------------------------------------------//

}
