import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';                     // API Client Service
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class FileManagerService {
  //Initialize selected file objects:
  public uploadProgress : Number = 0;
  public controller     : any = {};

  //Inject services, components and router to the constructor:
  constructor(
    private apiClient           : ApiClientService,
    public sharedProp           : SharedPropertiesService,
    public sharedFunctions      : SharedFunctionsService
  ) { }


  //--------------------------------------------------------------------------------------------------------------------//
  // ON FILE SELECTED:
  //--------------------------------------------------------------------------------------------------------------------//
  onFileSelected(event: any, type: string){
    //Upload selected file (RxJS):
    this.apiClient.sendFileRequest(
        'files/insert',
        <File>event.target.files[0],
        this.sharedProp.current_imaging.organization._id,
        this.sharedProp.current_imaging.branch._id,
        type
      ).subscribe({
      next: (res) => {
        //Check operation status:
        switch(res.operation_status){
          case 'uploading':
            //Disable upload button:
            this.controller[type].disabled = true;

            //Set upload progress:
            this.uploadProgress = res.progress, 10;

            break;

          case 'finished':
            //Check operation status (backend server response):
            if(res.server_response.body.success === true){

              //Add current atached file in atachedFiles object:
              this.controller[type].files[res.server_response.body.data._id] = res.server_response.body.data.name;

              //Send snakbar message:
              this.sharedFunctions.sendMessage('Archivo subido exitosamente');
            } else {
              //Send snakbar message:
              this.sharedFunctions.sendMessage(res.error.message);
            }

            //Enable upload button:
            this.controller[type].disabled = false;

            break;

          case 'cancelled':
            //Send snakbar message:
            this.sharedFunctions.sendMessage(res.message);

            break;
        }
      },
      error: res => {
        //Send snakbar message:
        if(res.error.message){
          this.sharedFunctions.sendMessage(res.error.message);
        } else {
          this.sharedFunctions.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
        }
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ON DELETE FILE:
  //--------------------------------------------------------------------------------------------------------------------//
  onDeleteFile(_id: any, type: string){
    //Create operation handler:
    const operationHandler = {
      element         : 'files',
      selected_items  : [_id],
      excludeRedirect : true
    }

    //Open dialog to confirm:
    this.sharedFunctions.openDialog('delete', operationHandler, (result) => {
      //Check result:
      if(result === true){
        //Remove deleted file from atachedFiles object:
        delete this.controller[type].files[_id];
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DOWNLOAD FILE:
  //--------------------------------------------------------------------------------------------------------------------//
  downloadFile(_id: any){
    //Find selected file:
    this.sharedFunctions.find('files', { 'filter[_id]': _id }, (res) => {
      //Check data:
      if(res.data){
        //Set link source (base64):
        const linkSource ='data:application/octet-stream;base64,' + res.data[0].base64;

        //Create link to enable browser download dialog:
        const downloadLink = document.createElement('a');

        //Set downloadLink href:
        downloadLink.href = linkSource;

        //Set name of the file to download:
        downloadLink.download = res.data[0].name;

        //Trigger click (download):
        downloadLink.click();
      } else {
        //Send snakbar message:
        this.sharedFunctions.sendMessage('No se encontró el archivo [_id: ' + _id + ']: ' + res.message);
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
