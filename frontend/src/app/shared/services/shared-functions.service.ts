import { Component, Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';       // API Client Service
import { app_setting, keywords } from '@env/environment';                     // Environment
import { MatSnackBar } from '@angular/material/snack-bar';                    // SnackBar (Angular Material)
import { MatDialog } from '@angular/material/dialog';                         // Dialog (Angular Material)
import { map, filter, mergeMap, Observable } from 'rxjs';                     // Reactive Extensions (RxJS)

// Dialogs components:
import { DeleteItemsComponent } from '@shared/components/dialogs/delete-items/delete-items.component';
import { FoundPersonComponent } from '@shared/components/dialogs/found-person/found-person.component';
import { SlotSelectComponent } from '@shared/components/dialogs/slot-select/slot-select.component';
import { OverlapEventsComponent } from '@shared/components/dialogs/overlap-events/overlap-events.component';
import { TentativeExistComponent } from '@shared/components/dialogs/tentative-exist/tentative-exist.component';
import { EventDetailsComponent } from '@shared/components/dialogs/event-details/event-details.component';
import { DeleteAppointmentDraftComponent } from '@shared/components/dialogs/delete-appointment-draft/delete-appointment-draft.component';
import { MwlResendComponent } from '@shared/components/dialogs/mwl-resend/mwl-resend.component';
import { ReportReviewComponent } from '@shared/components/dialogs/report-review/report-review.component';
import { PasswordRequestComponent } from '@shared/components/dialogs/password-request/password-request.component';
import { PerformingDownloadsComponent } from '@shared/components/dialogs/performing-downloads/performing-downloads.component';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class SharedFunctionsService {
  public response           : any = {};
  public nested_response    : any = {};
  public delete_code        : string = '';
  public requested_password : string = '';

  constructor(
    private apiClient       : ApiClientService,
    private snackBar        : MatSnackBar,
    private dialog          : MatDialog
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
  sendMessage(message: string, duration: any | undefined = undefined): void {
    this.snackBar.open(message, 'ACEPTAR', duration);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // OPEN DIALOG:
  //--------------------------------------------------------------------------------------------------------------------//
  openDialog(operation: string, operationHandler: any = null, callback = (result: boolean) => {}, removeReference: any = undefined): void {
    if(operation !== '' && operationHandler !== null){
      //Switch by operation types:
      switch(operation){
        //DELETE FROM LIST COMPONENTS (GENERIC):
        case 'delete':
          //Initializate excludeRedirect:
          let excludeRedirect: boolean = false;

          //Check operationHandler excludeRedirect:
          if(operationHandler.excludeRedirect !== undefined && operationHandler.excludeRedirect === true){
            excludeRedirect = operationHandler.excludeRedirect;
          }

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
                  const result = this.deleteResponder(res, operationHandler.element, operationHandler.router, excludeRedirect);

                  //Excecute callback:
                  callback(result);
                });

              //Single delete:
              } else {
                //Check if there are references to remove:
                if(removeReference !== undefined){
                  //REMOVE reference:
                  console.log(removeReference.updateData);
                  const obsDelete = this.saveRxJS('update', removeReference.reference_object.element, removeReference.reference_object._id, removeReference.updateData, []).pipe(
                    //Filter that only success cases continue:
                    filter((res: any) => res.success === true),

                    //Remove single element (Return observable):
                    mergeMap(() => this.deleteRxJS('single', operationHandler.element, operationHandler.selected_items[0]))
                  );

                  //Observe content (Subscribe):
                  obsDelete.subscribe({
                    next: (res) => {
                      //Check operation status:
                      if(res.success === true){
                        //Response the deletion according to the result:
                        const result = this.deleteResponder(res, operationHandler.element, operationHandler.router, excludeRedirect);

                        //Excecute callback:
                        callback(result);
                      }
                    }
                  });

                //Remove single element without references:
                } else {
                  this.delete('single', operationHandler.element, operationHandler.selected_items[0], (res) => {
                    //Response the deletion according to the result:
                    const result = this.deleteResponder(res, operationHandler.element, operationHandler.router, excludeRedirect);

                    //Excecute callback:
                    callback(result);
                  });
                }
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

        //FULLCALENDAR EVENT DETAILS:
        case 'event_details':
          //Create dialog observable:
          const obsEventDetails = this.dialog.open(EventDetailsComponent, { data: operationHandler.event_data });

          //Observe content (Subscribe):
          obsEventDetails.afterClosed().subscribe(result => {
            //Excecute callback:
            callback(result);
          });

          break;

        //DELETE APPOINTMENT DRAFT:
        case 'delete_appointment_draft':
          //Create dialog observable:
          const obsDeleteAppointmentDraft = this.dialog.open(DeleteAppointmentDraftComponent, { data: operationHandler.appointment_draft });

          //Observe content (Subscribe):
          obsDeleteAppointmentDraft.afterClosed().subscribe(result => {
            //Check if result is true:
            if(result){
              this.delete('single', operationHandler.element, operationHandler.appointment_draft._id, (res) => {
                //Response the deletion according to the result:
                const result = this.deleteResponder(res, operationHandler.element, false, true);

                //Excecute callback:
                callback(result);
              });
            }
          });

          break;

        //MWL RE-SEND DIALOG:
        case 'mwl_resend':
          //Create dialog observable:
          const obsMWLResend = this.dialog.open(MwlResendComponent, { data: operationHandler });

          //Observe content (Subscribe):
          obsMWLResend.afterClosed().subscribe(result => {
            //Excecute callback:
            callback(result);
          });

          break;

        //REPORT REVIEW (SIGN, AUTH & AMEND)
        case 'report_review':
          //Create dialog observable:
          const obsReportReview = this.dialog.open(ReportReviewComponent, { data: operationHandler });

          //Observe content (Subscribe):
          obsReportReview.afterClosed().subscribe(result => {
            //Excecute callback:
            callback(result);
          });

          break;

        //REQUEST USER PASSWORD DIALOG:
        case 'password_request':
          //Create dialog observable:
          const obsPasswordRequest = this.dialog.open(PasswordRequestComponent);

          //Observe content (Subscribe):
          obsPasswordRequest.afterClosed().subscribe(result => {
            //Excecute callback:
            callback(result);
          });

          break;

        //PERFORMING DOWNLOAD CONTENTS DIALOG:
        case 'performing_downloads':
          this.basicDialog(PerformingDownloadsComponent, operationHandler, (result) => { callback(result) });
          break;
      }
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // BASIC DIALOG:
  //--------------------------------------------------------------------------------------------------------------------//
  basicDialog(component: any, operationHandler: any = null, callback = (result: any) => {}){
    //Create dialog observable:
    const obsBasicDialog = this.dialog.open(component, { data: operationHandler });

    //Observe content (Subscribe):
    obsBasicDialog.afterClosed().subscribe(result => {
      //Excecute callback:
      callback(result);
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND - (FIND, FIND ONE & FIND BY ID):
  //--------------------------------------------------------------------------------------------------------------------//
  find(element: string, params: any, callback = (res: any) => {}, findOne: boolean = false, findByService: boolean = false, saveResponse: boolean = true): void {
    //Initialize operation type:
    let operation = 'find';

    //Check if findOne is true:
    if(findOne){ operation = 'findOne'; }

    //Check if findByService is true (Only the users module uses this case):
    if(findByService){ operation = 'findByService'; }

    //Check if element is not empty:
    if(element != ''){
      //Create observable obsFind:
      const obsFind = this.apiClient.sendRequest('GET', element + '/' + operation, params);

      //Observe content (Subscribe):
      obsFind.subscribe({
        next: res => {
          //Check if you want to save the response in sharedFunctions.response:
          if(saveResponse){
            this.response = res;
          }

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
  save(operation: string, element: string, _id: string, data: any, exceptions: Array<string> = [], callback = (res: any) => {}, saveResponse: boolean = true): void {
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
            //Check if you want to save the response in sharedFunctions.response:
            if(saveResponse){
              this.response = res;
            }

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
            if(res.error.dependencies){
              //Send dependencies error:
              this.sendMessage(res.error.message + ' ' + JSON.stringify(res.error.dependencies));
            } else if(res.error.message){
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
  // FIND RXJS - (FIND, FIND ONE & FIND BY ID):
  //--------------------------------------------------------------------------------------------------------------------//
  findRxJS(element: string, params: any, findOne: boolean = false, findByService: boolean = false, saveResponse: boolean = true): Observable<any>{
    //Initialize operation type:
    let operation = 'find';

    //Check if findOne is true:
    if(findOne){ operation = 'findOne'; }

    //Check if findByService is true (Only the users module uses this case):
    if(findByService){ operation = 'findByService'; }

    //Return Observable:
    return new Observable<any>((observer) => {

      //Check if element is not empty:
      if(element != ''){
        //Create observable obsFind:
        const obsFind = this.apiClient.sendRequest('GET', element + '/' + operation, params);

        //Observe content (Subscribe):
        obsFind.subscribe({
          next: res => {
            //Check if you want to save the response in sharedFunctions.response:
            if(saveResponse){
              this.response = res;
            }

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
  saveRxJS(operation: string, element: string, _id: string, data: any, exceptions: Array<string> = [], saveResponse: boolean = true): Observable<any> {
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
              //Check if you want to save the response in sharedFunctions.response:
              if(saveResponse){
                this.response = res;
              }

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
  // DELETE RXJS - (SINGLE AND BATCH DELETE):
  //--------------------------------------------------------------------------------------------------------------------//
  deleteRxJS(operation: string, element: string, selected_items: any): Observable<any> {
    //Initializate URL:
    let url = '';

    //Return Observable:
    return new Observable<any>((observer) => {

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
            observer.next(false);
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
              //Pass chunks of data between observables:
              observer.next(res);
            },
            error: res => {
              //Send snakbar message:
              if(res.error.dependencies){
                //Send dependencies error:
                this.sendMessage(res.error.message + ' ' + JSON.stringify(res.error.dependencies));
              } else if(res.error.message){
                //Send other errors:
                this.sendMessage(res.error.message);

              } else {
                this.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
              }
              observer.next(false);
            }
          });
        }
      } else {
        this.sendMessage('Error: Debe determinar la operación "tipo de eliminación".');
        observer.next(false);
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SEND TO MWL:
  //--------------------------------------------------------------------------------------------------------------------//
  sendToMWL(fk_appointment: string, refresh_list: boolean = false, list_params: any = {}){
    //Create MWL Observable:
    //Use Api Client to prevent reload current list response [sharedFunctions.save -> this.response = res]:
    const obsMWL = this.apiClient.sendRequest('POST', 'mwl/insert', { 'fk_appointment': fk_appointment });

    //Observe content (Subscribe):
    obsMWL.subscribe({
      next: res => {
        //Check operation status:
        if(res.success === true){
          //Format date:
          const formatted_date = this.accessionDateFormat(res.accession_number);

          //Send message:
          this.sendMessage('Enviado exitosamente a MWL ' + formatted_date.day + '/' + formatted_date.month + '/' + formatted_date.year + ' ' + formatted_date.hour + ':' + formatted_date.minute + ':' + formatted_date.second, { duration: 2000 });

          //Check if refresh current find:
          if(refresh_list){
            //Refresh list to update buttons that depend on ng directives (Accession Number MWL control).
            this.find(list_params.element, list_params.params);
          }
        } else {
          //Send message:
          this.sendMessage(res.message + ' Detalle del error: ' + res.error);
        }
      },
      error: res => {
        //Send snakbar message:
        if(res.error.message){
          //Check if have details error:
          if(res.error.error){
            this.sendMessage(res.error.message + ' Error: ' + res.error.error);
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
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ACCESSION NUMBER DATE FORMAT:
  //--------------------------------------------------------------------------------------------------------------------//
  accessionDateFormat(accession_number: string): any{
    return {
      year        : accession_number.slice(0, 4),
      month       : accession_number.slice(4, 6),
      day         : accession_number.slice(6, 8),
      hour        : accession_number.slice(8, 10),
      minute      : accession_number.slice(10, 12),
      second      : accession_number.slice(12, 14),
      milisecond  : accession_number.slice(14, 16)
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------------------------------//
  // GET LOGGED ORGANIZATION:
  //--------------------------------------------------------------------------------------------------------------------//
  getLoggedOrganization(domain: string, domainType: string, callback = (result: string) => {}): void {
    //Check domain type:
    switch(domainType){
      case 'organization':
        callback(domain);
        break;

      case 'branch':
        this.find('branches', { 'filter[_id]': domain, 'proj[fk_organization]': 1 }, (res) => {
          if(res.success === true){
            //Execute callback:
            callback(res.data[0].fk_organization);
          }
        });

        break;

      case 'service':
        //Initialize fk_branch:
        let fk_branch = '';

        const obsDomain = this.findRxJS('services', { 'filter[_id]': domain, 'proj[fk_branch]': 1 }).pipe(
          //Check first result (find service):
          map((res: any) => {
            //Check operation status:
            if(res.success === true){
              fk_branch = res.data[0].fk_branch;
            }

            //Return response:
            return res;
          }),

          //Filter that only success cases continue:
          filter((res: any) => res.success === true),

          //Search branch to obtain fk_organization (Return observable):
          mergeMap(() => this.findRxJS('branches', { 'filter[_id]': fk_branch, 'proj[fk_organization]': 1 })),
        );

        //Observe content (Subscribe):
        obsDomain.subscribe({
          next: (res) => {
            if(res.success === true){
              //Execute callback:
              callback(res.data[0].fk_organization);
            }
          }
        });

        break;
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
  formResponder(res: any, element: any, router: any, redirectToList: boolean = true, custom_message: string = ''){
    //Check and set custom message:
    if(custom_message === ''){
      custom_message = '¡Guardado existoso!';
    }

    //Check operation status:
    if(res.success === true){
      //Send snakbar message:
      //Success with blocked_attributes & blocked_unset:
      if(res.blocked_attributes && res.blocked_unset){
        this.sendMessage(custom_message + ' - Atributos bloqueados: ' + JSON.stringify(res.blocked_attributes) + ' - Eliminaciones bloqueadas: ' + JSON.stringify(res.blocked_unset));

      //Success with blocked_attributes:
      } else if(res.blocked_attributes){
        this.sendMessage(custom_message + ' - Atributos bloqueados: ' + JSON.stringify(res.blocked_attributes));

      //Success with blocked_unset:
      } else if(res.blocked_unset){
        this.sendMessage(custom_message + ' - Eliminaciones bloqueadas: ' + JSON.stringify(res.blocked_unset));

      //Success without blocked elements:
      } else {
        this.sendMessage(custom_message, { duration: 2000 });
      }

      //Redirect to:
      if(redirectToList){
        //The element list component:
        this.gotoList(element, router);
      } else {
        //The element indicated:
        router.navigate([element]);
      }

    } else {
      //Send snakbar message:
      this.sendMessage(res.message);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------------------------------//
  // DELETE RESPONDER:
  //--------------------------------------------------------------------------------------------------------------------//
  deleteResponder(res: any, element: any, router: any, excludeRedirect: boolean = false): boolean{
    //Initialize result:
    let result: boolean = false;

    //Check operation status:
    if(res.success === true){
      //Set result:
      result = true;

      //Send snakbar message:
      this.sendMessage(res.message, { duration: 2000 });

      //Check excludeRedirect:
      if(excludeRedirect === false && excludeRedirect !== undefined){
        //Reload a component:
        router.routeReuseStrategy.shouldReuseRoute = () => false;
        router.onSameUrlNavigation = 'reload';

        //Redirect to list element:
        router.navigate(['/' + element + '/list']);
      }
    } else {
      //Check validate errors:
      if(res.validate_errors){
        //Send snakbar message:
        this.sendMessage(res.message + ', ' + res.validate_errors);
      } else if(res.dependencies){
        //Send snakbar message:
        this.sendMessage(res.message + ', ' + JSON.stringify(res.dependencies));
      } else {
        //Send snakbar message:
        this.sendMessage(res.message);
      }
    }

    //Return result:
    return result;
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


  //--------------------------------------------------------------------------------------------------------------------//
  // DATETIME FULLCALENDAR FORMATER:
  //--------------------------------------------------------------------------------------------------------------------//
  datetimeFulCalendarFormater(start: any, end: any): any{
    //Date:
    const dateYear   = start.getFullYear();
    const dateMonth  = start.toLocaleString("es-AR", { month: "2-digit" });
    const dateDay    = start.toLocaleString("es-AR", { day: "2-digit" })

    //Start:
    const startHours    = this.addZero(start.getUTCHours());
    const startMinutes  = this.addZero(start.getUTCMinutes());

    //End:
    const endHours    = this.addZero(end.getUTCHours());
    const endMinutes  = this.addZero(end.getUTCMinutes());

    //Set start and end FullCalendar format:
    const startStr = dateYear + '-' + dateMonth + '-' + dateDay + 'T' + startHours + ':' + startMinutes + ':00';
    const endStr   = dateYear + '-' + dateMonth + '-' + dateDay + 'T' + endHours + ':' + endMinutes + ':00';

    //Set return object:
    return {
      dateYear      : dateYear,
      dateMonth     : dateMonth,
      dateDay       : dateDay,
      startHours    : startHours,
      startMinutes  : startMinutes,
      endHours      : endHours,
      endMinutes    : endMinutes,
      start         : startStr,
      end           : endStr
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET TIMESTAMP:
  //--------------------------------------------------------------------------------------------------------------------//
  getTimeStamp(): string{
    //Get now:
    const today = new Date();

    //Structure today date:
    const year   = today.getFullYear();
    const month  = today.toLocaleString("es-AR", { month: "2-digit" });
    const day    = today.toLocaleString("es-AR", { day: "2-digit" });
    const hours    = this.addZero(today.getHours());
    const minutes  = this.addZero(today.getUTCMinutes());

    //Return timestamp:
    return '' + year + month + day + hours + minutes;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ADD ZERO:
  //--------------------------------------------------------------------------------------------------------------------//
  addZero(i: any) {
    if(i < 10){
      i = "0" + i.toString()
    }
    return i;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // CAPITALIZE FIRST LETTER:
  //--------------------------------------------------------------------------------------------------------------------//
  capitalizeFirstLetter(str: string): string {
    //Converting string to lower case:
    const toLowerString = str.toLocaleLowerCase();

    //Converting first letter to uppercase:
    const capitalizedString = toLowerString.charAt(0).toUpperCase() + toLowerString.slice(1);

    //Return capitalized string:
    return capitalizedString;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIX FULLCALENDAR RENDER:
  //--------------------------------------------------------------------------------------------------------------------//
  fixFullCalendarRender(ms: any = 1){
    // Fix FullCalendar bug first Render:
    // https://github.com/fullcalendar/fullcalendar/issues/4976
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, ms);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET FRIENDLY PASS:
  //--------------------------------------------------------------------------------------------------------------------//
  getFriendlyPass(): string {
    //Initialize password:
    let password = keywords[this.getRandomNumber(0, keywords.length)];


    //Get a random number between 100 and 998:
    let random_number = this.getRandomNumber(100, 998);

    //Check that the random number is not 666 - Superstitions (-_-'):
    while(random_number === 666){
      random_number = this.getRandomNumber(100, 998);
    }

    //Return friendly password:
    return password + random_number;
  }

  getRandomNumber(min: number, max: number): number{
    return Math.floor(Math.random() * (max - min) + min)
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // CHECK CONCESSIONS:
  //--------------------------------------------------------------------------------------------------------------------//
  checkConcessions(sharedProp: any, check: number[]): boolean {
    return sharedProp.userLogged.permissions[0].concession.some((value: number) => check.includes(value))
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ARRAY COUNT VALUES:
  //--------------------------------------------------------------------------------------------------------------------//
  async arrayCountValues(array: any[]){
    //Initialize count object:
    const count: any = {};

    await Promise.all(Object.keys(array).map((key) => {
      if (count[array[parseInt(key, 10)]]) {
        count[array[parseInt(key, 10)]] += 1;
      } else {
        count[array[parseInt(key, 10)]] = 1;
      }
    }));

    //Return count:
    return count;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DUPLICATED SURNAMES:
  //--------------------------------------------------------------------------------------------------------------------//
  async duplicatedSurnames(res: any){
    //Clear all surnames in repetition controller:
    let duplicatedSurnamesController : any = {
      repeatedSurnames  : {},
      allSurnames       : [],
    }

    //Keep all surnames:
    await Promise.all(Object.keys(res.data).map((key) => {
      duplicatedSurnamesController.allSurnames.push(res.data[key].patient.person.surname_01);

      if(res.data[key].patient.person.surname_02 !== '' && res.data[key].patient.person.surname_02 !== undefined && res.data[key].patient.person.surname_02 !== null){
        duplicatedSurnamesController.allSurnames.push(res.data[key].patient.person.surname_02);
      }
    }));

    //Count repeated surnames:
    duplicatedSurnamesController.repeatedSurnames = await this.arrayCountValues(duplicatedSurnamesController.allSurnames);

    //Return repetition controller:
    return duplicatedSurnamesController;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND SERVICE USERS (FIND BY SERVICE):
  //--------------------------------------------------------------------------------------------------------------------//
  findServiceUsers(service_id: string, role: number, callback = (res: any) => {}){
    //Set params:
    const params = {
      //Only people users:
      'filter[person.name_01]': '',
      'regex': true,

      //Only selected role users in selected service, current branch and current organization (findByService):
      'service': service_id,
      'role': role,

      //Exclude users with vacation true:
      'filter[professional.vacation]': false,

      //Only enabled users:
      'filter[status]': true,

      //Projection:
      'proj[password]': 0,
      'proj[permissions]': 0,
      'proj[settings]': 0
    };

    //Find by service selected role users (last true parameter):
    this.find('users', params, (res) => callback(res), false, true);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND NESTED ELEMENTS:
  //--------------------------------------------------------------------------------------------------------------------//
  async findNestedElements(res: any, element: any){
    //Initialize nested IN array:
    let nestedIN : any = [];

    //Preserve _ids from last search (await foreach):
    await Promise.all(Object.keys(res.data).map((key) => {
      nestedIN.push(res.data[key]._id);
    }));

    //Set initial params:
    let params: any = {
      'filter[status]'  : true,
    }

    //Check only one element nested case:
    if(nestedIN.length == 1){
      params['filter[fk_appointment]'] = nestedIN[0];
    } else if(nestedIN.length > 1){
      params['filter[in][fk_appointment]'] = nestedIN;
    }
    
    //Search only if there are results in the previous search:
    if(nestedIN.length > 0){
      //Find nested elements:
      this.find(element, params, (nestedRes) => {
        //Save result in nested response objents:
        this.nested_response = nestedRes;
      }, false, false, false);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // CALCULATE DOSE:
  //--------------------------------------------------------------------------------------------------------------------//
  calculateDose(weight: string, coefficient: string): string{
    //Parse weight and coefficient to float:
    const numberWeight = parseFloat(weight);
		const numberCoefficient = parseFloat(coefficient);

    //Calculate dose:
		const numberDose: number = numberWeight * numberCoefficient;
		
    //Return calculated dose:
    return numberDose.toFixed(2)
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // CALCULATE AGE:
  //--------------------------------------------------------------------------------------------------------------------//
  calculateAge(birth_date: any, moment_date: string = ''): string{
    //Format birth date to Date:
    birth_date = new Date(birth_date);

    //Structure birth date:
    const year   = birth_date.getFullYear();
    const month  = birth_date.toLocaleString("es-AR", { month: "2-digit" });
    const day    = birth_date.toLocaleString("es-AR", { day: "2-digit" });

    //Initializate today date:
    let today = new Date();

    //Check moment date to set today date:
    if(moment_date !== '' || moment_date !== undefined || moment_date !== null){
      today = new Date(moment_date);
    }

    //Calculate age (in years):
    let age = today.getFullYear() - year;
    if(today.getMonth() < month || (today.getMonth() == month && today.getDate() < day)){
      age--;
    }
    
    //Return calculated age:
    //In case the calculated age is less than one year:
    if(age <= 0){
      //Calculate age (in months):
      let months_age = parseInt(today.toLocaleString("es-AR", { month: "2-digit" }), 10) - parseInt(month, 10);

      //Check months:
      if(months_age <= 0){
        //Set age (in days):
        return parseInt(today.toLocaleString("es-AR", { day: "2-digit" }), 10) + ' días';

      } else if(months_age == 1) {
        return months_age + ' mes';

      } else {
        return months_age + ' meses';
      }
      
    } else if(age == 1) {
      return age + ' año';

    } else {
      return age + ' años';
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // MBq to mCI:
  // Megabecquerel to Millicurie Conversion.
  //--------------------------------------------------------------------------------------------------------------------//
  MBqTomCi(MBq: number | string): number {
    //Initializate result:
    let result = 0;

    //Check input value exist and concert:
    if(MBq !== undefined && MBq !== null){
      return parseFloat(MBq.toString()) * 0.027027027027027;
    }

    //Return result:
    return result;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // mCI to MBq:
  // Millicurie to Megabecquerel Conversion.
  //--------------------------------------------------------------------------------------------------------------------//
  mCiToMBq(mCi: number | string): number {
    //Initializate result:
    let result = 0;

    //Check input value exist and concert:
    if(mCi !== undefined && mCi !== null){
      result = parseFloat(mCi.toString()) * 37;
    }

    //Return result:
    return result;
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
