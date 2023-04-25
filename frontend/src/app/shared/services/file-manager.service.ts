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
  // UPLOAD:
  //--------------------------------------------------------------------------------------------------------------------//
  upload(event: any, type: string, reference_object: any = undefined){
    //Upload selected file (RxJS):
    this.apiClient.sendFileRequest(
        'files/insert',
        <File>event.target.files[0],
        this.sharedProp.current_imaging.organization._id,
        this.sharedProp.current_imaging.branch._id,
        type
      ).subscribe({
      next: async (res) => {
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

              //Check reference object (updates cases):
              if(reference_object !== undefined){
                //Create update data object:
                let updateData: any = {};

                //Add current file _id to reference:
                if(type == 'attached_files'){
                  reference_object.current_files.push(res.server_response.body.data._id);
                  updateData[type] = reference_object.current_files;
                } else {
                  //Prevent: Cannot set properties of undefined:
                  if(!updateData.consents){ updateData['consents'] = {}; }

                  //Preserve previous consents fks:
                  if(reference_object.preserve.files.length > 0){
                    updateData.consents[reference_object.preserve.key] = reference_object.preserve.files;
                  }

                  //Set current file fk reference:
                  updateData.consents[type] = res.server_response.body.data._id;
                }

                //Save ADD reference:
                this.sharedFunctions.save('update', reference_object.element, reference_object._id, updateData, [], (resUpdate) => {
                  if(resUpdate.success !== true){
                    //Send snakbar message:
                    this.sharedFunctions.sendMessage(resUpdate.message);
                  }
                });
              }

              //Add current atached file in atachedFiles object:
              this.controller[type].files[res.server_response.body.data._id] = res.server_response.body.data.name;

              //Send snakbar message:
              this.sharedFunctions.sendMessage('Archivo subido exitosamente', { duration: 2000 });
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
  // DELETE:
  //--------------------------------------------------------------------------------------------------------------------//
  delete(_id: any, type: string, reference_object: any = undefined){
    //Create operation handler:
    const operationHandler = {
      element         : 'files',
      selected_items  : [_id],
      excludeRedirect : true
    }

    //Create update data object:
    let updateData: any = {};

    //Remove current file _id to reference:
    if(type == 'attached_files' && reference_object.current_files.length > 1){
      this.sharedFunctions.removeItemFromArray(reference_object.current_files, _id);

      //Set update data object without deleted element:
      updateData[type] = reference_object.current_files;

    //Set unset params attached_files:
    } else if(type == 'attached_files') {
      updateData['unset'] = {};
      updateData.unset[type] = '';

    //Set unset params consents:
    } else {
      updateData['unset'] = {};
      updateData.unset['consents'] = {};
      updateData.unset.consents[type] = '';
    }

    //Open dialog to confirm:
    this.sharedFunctions.openDialog('delete', operationHandler, (result) => {
      //Check result:
      if(result === true){
        //Remove deleted file from atachedFiles object:
        delete this.controller[type].files[_id];
      }
    }, { reference_object: reference_object, updateData: updateData });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DOWNLOAD:
  //--------------------------------------------------------------------------------------------------------------------//
  download(_id: any){
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
    }, false, false, false);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
