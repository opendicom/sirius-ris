import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';       // API Client Service
import { app_setting } from '@env/environment';                               // Environment
import { MatSnackBar } from '@angular/material/snack-bar';                    // SnackBar (Angular Material)
import { MatDialog } from '@angular/material/dialog';                         // Dialog (Angular Material)
import { Observable } from 'rxjs';                                            // Reactive Extensions (RxJS)

// Dialogs components:
import { DeleteItemsComponent } from '@shared/components/dialogs/delete-items/delete-items.component';
import { FoundPersonComponent } from '@shared/components/dialogs/found-person/found-person.component';
import { SlotSelectComponent } from '@shared/components/dialogs/slot-select/slot-select.component';
import { OverlapEventsComponent } from '@shared/components/dialogs/overlap-events/overlap-events.component';
import { TentativeExistComponent } from '@shared/components/dialogs/tentative-exist/tentative-exist.component';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class SharedFunctionsService {
  public response       : any = {};
  public delete_code    : string = '';

  constructor(
    private apiClient   : ApiClientService,
    private snackBar    : MatSnackBar,
    private dialog      : MatDialog
  ) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // SIMPLE CRYPT:
  //--------------------------------------------------------------------------------------------------------------------//
  simpleCrypt (message: string): string {
    const secret_number = app_setting.secret_number;
    let encoded = '';
    for (let i=0; i < message.length; i++) {
      let a = message.charCodeAt(i);
      let b = a ^ secret_number;
      encoded = encoded+String.fromCharCode(b);
    }
    return encoded;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // REMOVE ITEM FROM ARRAY:
  // Function to remove elements from an array.
  //--------------------------------------------------------------------------------------------------------------------//
  removeItemFromArray(array: Array<any>, item: any){
    let indice = array.indexOf(item);
    array.splice(indice, 1);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET KEYS:
  //--------------------------------------------------------------------------------------------------------------------//
  getKeys(object: any, sort: boolean = false, removeEmptyFields: boolean = false, removeTimestamps: boolean = false): Array<string> {
    //Get all object keys:
    let keys =  Object.keys(object);

    //Remove empty fields:
    if(removeEmptyFields){
      Object.keys(object).forEach(current => {
        if(object[current] === null || object[current] === undefined || object[current] === ''){
          this.removeItemFromArray(keys, current);
        }
      });
    }

    //Remove timestamps and version keys:
    if(removeTimestamps){
      this.removeItemFromArray(keys, 'updatedAt');
      this.removeItemFromArray(keys, 'createdAt');
      this.removeItemFromArray(keys, '__v');
    }

    //Sort:
    if(sort){ keys = keys.sort(); }

    //Return keys:
    return keys;
  };
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // READ TOKEN:
  //--------------------------------------------------------------------------------------------------------------------//
  readToken(tmp: Boolean = false): string {
    let siriusAuth: any;
    let fileName: String;

    //Set file name:
    if(tmp){
      fileName = 'sirius_temp';
    } else {
      fileName = 'sirius_auth';
    }

    //Get encoded local file content:
    siriusAuth = localStorage.getItem(fileName.toString());

    //Decode content:
    siriusAuth = this.simpleCrypt(siriusAuth);

    //Parse to JS object:
    siriusAuth = JSON.parse(siriusAuth);

    //Get token:
    return siriusAuth.token;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET USER INFO:
  //--------------------------------------------------------------------------------------------------------------------//
  getUserInfo(tmp: Boolean = false): any {
    let siriusAuth: any;
    let fileName: String;

    //Set file name:
    if(tmp){
      fileName = 'sirius_temp';
    } else {
      fileName = 'sirius_auth';
    }

    //Get encoded local file content:
    siriusAuth = localStorage.getItem(fileName.toString());

    //Decode content:
    siriusAuth = this.simpleCrypt(siriusAuth);

    //Parse to JS object:
    siriusAuth = JSON.parse(siriusAuth);

    //Delete object's token property:
    delete siriusAuth.token;

    //Get authentication object without token (No JWT):
    return siriusAuth;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // CLEAN EMPTY FIELDS:
  //--------------------------------------------------------------------------------------------------------------------//
  cleanEmptyFields(operation: string, obj: any, exeptions: Array<string> = []) {
    //Iterate over the object:
    Object.keys(obj).forEach((key) => {
      //Check empty fields:
      if (obj[key] === null || obj[key] === undefined || obj[key] === '') {

        //Check exceptions (unset values):
        if(exeptions.includes(key)){
          //Check operation:
          if(operation == 'update'){
            //Create property unset if not exist:
            if(!obj.hasOwnProperty('unset')){
              obj['unset'] = {}
            }

            //Add unset value:
            obj['unset'][key] = '';
          }
        }

        //Delete empty field:
        delete obj[key];
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET DATETIME FORMAT:
  // Duplicated method to prevent circular dependency - [Duplicated method: shared-properties.service].
  //--------------------------------------------------------------------------------------------------------------------//
  setDatetimeFormat(date: Date, time: string = '00:00'): string{
    //Fix Eastern Daylight Time (TimezoneOffset):
    date.getTimezoneOffset();

    //Separate date:
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    //Set backend datetime format (string):
    const datetime = year + "-" + month + "-" + day + "T" + time + ":00.000Z";

    //Return formated datetime:
    return datetime;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SEND MESSAGE:
  //--------------------------------------------------------------------------------------------------------------------//
  sendMessage(message: string): void {
    this.snackBar.open(message, 'ACEPTAR');
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // OPEN DIALOG:
  //--------------------------------------------------------------------------------------------------------------------//
  openDialog(operation: string, operationHandler: any = null, callback = (result: boolean) => {}): void {
    if(operation !== '' && operationHandler !== null){
      //Switch by operation types:
      switch(operation){
        //DELETE FROM LIST COMPONENTS (GENERIC):
        case 'delete':
          //Create dialog observable:
          const dialogObservable = this.dialog.open(DeleteItemsComponent);

          //Observe content (Subscribe):
          dialogObservable.afterClosed().subscribe(result => {
            //Check if result is true:
            if(result){
              //Batch delete:
              if(operationHandler.selected_items.length > 1){
                this.delete('batch', operationHandler.element, operationHandler.selected_items, (res) => {
                  //Response the deletion according to the result:
                  this.deleteResponder(res, operationHandler.element, operationHandler.router);
                });

              //Single delete:
              } else {
                this.delete('single', operationHandler.element, operationHandler.selected_items[0], (res) => {
                  //Response the deletion according to the result:
                  this.deleteResponder(res, operationHandler.element, operationHandler.router);
                });
              }
            }
          });
          break;

        //FOUND PERSON WITH USER EMAIL IN USER FORM COMPONENT:
        case 'found_person':
          //Create dialog observable:
          const obsDialog = this.dialog.open(FoundPersonComponent, { data: operationHandler.user_data });

          //Observe content (Subscribe):
          obsDialog.afterClosed().subscribe(result => {
            //Excecute callback:
            callback(result);
          });

          break;

        //SELECT DATE WITHIN A SLOT:
        case 'slot_select':
          //Create dialog observable:
          const obsSlotSelectDialog = this.dialog.open(SlotSelectComponent);

          //Observe content (Subscribe):
          obsSlotSelectDialog.afterClosed().subscribe(result => {
            //Excecute callback:
            callback(result);
          });

          break;

        //OVERLAP EVENTS:
        case 'overlap_events':
          //Create dialog observable:
          const obsOverlapEvents = this.dialog.open(OverlapEventsComponent, { data: operationHandler });

          //Observe content (Subscribe):
          obsOverlapEvents.afterClosed().subscribe(result => {
            //Excecute callback:
            callback(result);
          });

          break;

        //SELECT DATE BUT ALREADY EXIST A TENTATIVE EVENT:
        case 'tentative_exist':
          //Create dialog observable:
          const obsTentativeExist = this.dialog.open(TentativeExistComponent);

          //Observe content (Subscribe):
          obsTentativeExist.afterClosed().subscribe(result => {
            //Excecute callback:
            callback(result);
          });

          break;
      }
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND - (FIND, FIND ONE & FIND BY ID):
  //--------------------------------------------------------------------------------------------------------------------//
  find(element: string, params: any, callback = (res: any) => {}, findOne: boolean = false): void {
    //Initialize operation type:
    let operation = 'find';

    //Check if findOne is true:
    if(findOne){
      operation = 'findOne';
    }

    //Check if element is not empty:
    if(element != ''){
      //Create observable obsFind:
      const obsFind = this.apiClient.sendRequest('GET', element + '/' + operation, params);

      //Observe content (Subscribe):
      obsFind.subscribe({
        next: res => {
          this.response = res;

          //Excecute optional callback with response:
          callback(res);
        },
        error: res => {
          //Send snakbar message:
          if(res.error.message){
            this.sendMessage(res.error.message);
          } else {
            this.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
          }
        }
      });
    } else {
      this.sendMessage('Error: Debe determinar el tipo de elemento.');
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SAVE - (INSERT & UPDATE):
  //--------------------------------------------------------------------------------------------------------------------//
  save(operation: string, element: string, _id: string, data: any, exceptions: Array<string> = [], callback = (res: any) => {}): void {
    //Validate data - Delete empty fields:
    this.cleanEmptyFields(operation, data, exceptions);

    //Add _id only for update case:
    if(operation == 'update' && _id != ''){
      data._id = _id;
    }

    //Check if element is not empty:
    if(element != ''){

      //Check if operation is not empty:
      if(operation != ''){
        //Save data:
        //Create observable obsSave:
        const obsSave = this.apiClient.sendRequest('POST', element + '/' + operation, data);

        //Observe content (Subscribe):
        obsSave.subscribe({
          next: res => {
            this.response = res;

            //Excecute optional callback with response:
            callback(res);
          },
          error: res => {
            //Send snakbar message:
            if(res.error.message){
              //Check validate errors:
              if(res.error.validate_errors){
                this.sendMessage(res.error.message + ' ' + res.error.validate_errors);
              } else {
                //Send other errors:
                this.sendMessage(res.error.message);
              }
            } else {
              this.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
            }
          }
        });
      }
    } else {
      this.sendMessage('Error: Debe determinar el tipo de elemento.');
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND RXJS - (FIND, FIND ONE & FIND BY ID):
  //--------------------------------------------------------------------------------------------------------------------//
  findRxJS(element: string, params: any, findOne: boolean = false): Observable<any>{
    //Initialize operation type:
    let operation = 'find';

    //Check if findOne is true:
    if(findOne){
      operation = 'findOne';
    }

    //Return Observable:
    return new Observable<any>((observer) => {

      //Check if element is not empty:
      if(element != ''){
        //Create observable obsFind:
        const obsFind = this.apiClient.sendRequest('GET', element + '/' + operation, params);

        //Observe content (Subscribe):
        obsFind.subscribe({
          next: res => {
            this.response = res;

            //Pass chunks of data between observables:
            observer.next(res);
          },
          error: res => {
            //Send snakbar message:
            if(res.error.message){
              this.sendMessage(res.error.message);
            } else {
              this.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
            }
            observer.next(false);
          }
        });
      } else {
        this.sendMessage('Error: Debe determinar el tipo de elemento.');
        observer.next(false);
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SAVE RXJS - (INSERT & UPDATE):
  //--------------------------------------------------------------------------------------------------------------------//
  saveRxJS(operation: string, element: string, _id: string, data: any, exceptions: Array<string> = []): Observable<any> {
    //Validate data - Delete empty fields:
    this.cleanEmptyFields(operation, data, exceptions);

    //Add _id only for update case:
    if(operation == 'update' && _id != ''){
      data._id = _id;
    }

    //Return Observable:
    return new Observable<any>((observer) => {

      //Check if element is not empty:
      if(element != ''){

        //Check if operation is not empty:
        if(operation != ''){
          //Save data:
          //Create observable obsSave:
          const obsSave = this.apiClient.sendRequest('POST', element + '/' + operation, data);

          //Observe content (Subscribe):
          obsSave.subscribe({
            next: res => {
              this.response = res;

              //Pass chunks of data between observables:
              observer.next(res);
            },
            error: res => {
              //Send snakbar message:
              if(res.error.message){
                //Check validate errors:
                if(res.error.validate_errors){
                  this.sendMessage(res.error.message + ' ' + res.error.validate_errors);
                } else {
                  //Send other errors:
                  this.sendMessage(res.error.message);
                }
              } else {
                this.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
              }
              observer.next(false);
            }
          });
        }
      } else {
        this.sendMessage('Error: Debe determinar el tipo de elemento.');
        observer.next(false);
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DELETE - (SINGLE AND BATCH DELETE):
  //--------------------------------------------------------------------------------------------------------------------//
  delete(operation: string, element: string, selected_items: any, callback = (res: any) => {}): void {
    //Initializate URL:
    let url = '';

    //Check operation:
    if(operation != ''){
      //Switch by operation:
      switch(operation){
        case 'single':
          url = element + '/delete';
          break;
        case 'batch':
          url = element + '/batch/delete';
          break;
        default:
          this.sendMessage('Error: Operación no permitida, "tipo de eliminación".');
          break;
      }

      //Check URL:
      if(url !== ''){
        //Set data to delete:
        const data = {
          _id         : selected_items,
          delete_code : this.delete_code
        };

        //Delete data:
        //Create observable obsDelete:
        const obsDelete = this.apiClient.sendRequest('POST', url, data);

        //Observe content (Subscribe):
        obsDelete.subscribe({
          next: res => {
            //Excecute optional callback with response:
            callback(res);
          },
          error: res => {
            //Send snakbar message:
            if(res.error.message){
              //Send other errors:
              this.sendMessage(res.error.message);

            } else {
              this.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
            }
          }
        });
      }
    } else {
      this.sendMessage('Error: Debe determinar la operación "tipo de eliminación".');
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GO TO LIST:
  //--------------------------------------------------------------------------------------------------------------------//
  gotoList(element: any, router: any): void{
    //Reset response data before redirect to the list:
    this.response = {};

    //Redirect to list element:
    router.navigate(['/' + element + '/list']);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FORM RESPONDER:
  //--------------------------------------------------------------------------------------------------------------------//
  formResponder(res: any, element: any, router: any){
    //Check operation status:
    if(res.success === true){
      //Send snakbar message:
      //Success with blocked_attributes & blocked_unset:
      if(res.blocked_attributes && res.blocked_unset){
        this.sendMessage('¡Guardado existoso! - Atributos bloqueados: ' + JSON.stringify(res.blocked_attributes) + ' - Eliminaciones bloqueadas: ' + JSON.stringify(res.blocked_unset));

      //Success with blocked_attributes:
      } else if(res.blocked_attributes){
        this.sendMessage('¡Guardado existoso! - Atributos bloqueados: ' + JSON.stringify(res.blocked_attributes));

      //Success with blocked_unset:
      } else if(res.blocked_unset){
        this.sendMessage('¡Guardado existoso! - Eliminaciones bloqueadas: ' + JSON.stringify(res.blocked_unset));

      //Success without blocked elements:
      } else {
        this.sendMessage('¡Guardado existoso!');
      }

      //Redirect to the list:
      this.gotoList(element, router);

    } else {
      //Send snakbar message:
      this.sendMessage(res.message);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------------------------------//
  // DELETE RESPONDER:
  //--------------------------------------------------------------------------------------------------------------------//
  deleteResponder(res: any, element: any, router: any){
    //Check operation status:
    if(res.success === true){
      //Send snakbar message:
      this.sendMessage(res.message);

      //Reload a component:
      router.routeReuseStrategy.shouldReuseRoute = () => false;
      router.onSameUrlNavigation = 'reload';

      //Redirect to list element:
      router.navigate(['/' + element + '/list']);

    } else {
      //Check validate errors:
      if(res.validate_errors){
        //Send snakbar message:
        this.sendMessage(res.message + ', ' + res.validate_errors);
      } else {
        //Send snakbar message:
        this.sendMessage(res.message);
      }
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET DATE RANGE LIMIT:
  //--------------------------------------------------------------------------------------------------------------------//
  setDateRangeLimit(date: Date){
    const currentYear   = date.getFullYear();
    const currentMonth  = date.getMonth();
    const currentDay    = date.getDate();

    //Set min and max dates (Datepicker):
    return {
      minDate: new Date(currentYear - 0, currentMonth, currentDay),
      maxDate: new Date(currentYear + 1, 11, 31)
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
