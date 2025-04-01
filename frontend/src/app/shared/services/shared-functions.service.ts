import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';       // API Client Service
import { MatSnackBar } from '@angular/material/snack-bar';                    // SnackBar (Angular Material)
import { MatDialog } from '@angular/material/dialog';                         // Dialog (Angular Material)
import { map, filter, mergeMap, Observable } from 'rxjs';                     // Reactive Extensions (RxJS)
import { utils, writeFileXLSX } from 'xlsx';                                  // SheetJS CE

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
import { MailDeliveryComponent } from '@shared/components/dialogs/mail-delivery/mail-delivery.component';
import { DicomAccessComponent } from '@shared/components/dialogs/dicom-access/dicom-access.component';
import { AppointmentRequestDetailsComponent } from '@shared/components/dialogs/appointment-request-details/appointment-request-details.component';
import { SearchInfoComponent } from '@shared/components/dialogs/search-info/search-info.component';
import { PatientDetailsComponent } from '@shared/components/dialogs/patient-details/patient-details.component';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class SharedFunctionsService {
  // mainSettings property is duplicated in the most important services to avoid 
  // circular dependencies and the content is set in the app.component constructor.
  public mainSettings       : any = {};
  public response           : any = {};
  public nested_response    : any = {};
  public delete_code        : string = '';
  public requested_password : string = '';
  public authenticated_performing : any = {}; // For performing list (report control).

  constructor(
    private apiClient       : ApiClientService,
    private snackBar        : MatSnackBar,
    private dialog          : MatDialog
  ) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // SIMPLE CRYPT:
  // Duplicated method to prevent circular dependency - [Duplicated method: http-interceptor.service].
  //--------------------------------------------------------------------------------------------------------------------//
  simpleCrypt (message: string): string {
    //Encode:
    let encoded = '';
    for (let i=0; i < message.length; i++) {
      let a = message.charCodeAt(i);
      let b = a ^ 1618;
      encoded = encoded+String.fromCharCode(b);
    }
    return encoded;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DECODE LOCAL FILE:
  //--------------------------------------------------------------------------------------------------------------------//
  decodeFile(fileName: string): any{
    let objFile: any;

    //Get encoded local file content:
    objFile = localStorage.getItem(fileName);

    //Decode content:
    objFile = this.simpleCrypt(objFile);

    //Parse to JS object:
    objFile = JSON.parse(objFile);

    //Return decoded and parsed object:
    return objFile;
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
  // Duplicated method to prevent circular dependency - [Duplicated method: http-interceptor.service].
  //--------------------------------------------------------------------------------------------------------------------//
  readToken(tmp: Boolean = false): string {
    let fileName: String;

    //Set file name:
    if(tmp){
      fileName = 'sirius_temp';
    } else {
      fileName = 'sirius_auth';
    }

    //Get token:
    return this.decodeFile(fileName.toString()).token;
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

    //Decode file:
    siriusAuth = this.decodeFile(fileName.toString());

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

        //PATIENT DETAILS:
        case 'patient_details':
          this.basicDialog(PatientDetailsComponent, operationHandler, (result) => { callback(result) });
          break;

        //PERFORMING DOWNLOAD CONTENTS DIALOG:
        case 'performing_downloads':
          this.basicDialog(PerformingDownloadsComponent, operationHandler, (result) => { callback(result) });
          break;

        //MAIL DELIVERY:
        case 'mail_delivery':
          this.basicDialog(MailDeliveryComponent, operationHandler, (result) => { callback(result) });
          break;

        //APPOINTMENT REQUESTS DETAILS:
        case 'appointment_requests_details':
          this.basicDialog(AppointmentRequestDetailsComponent, operationHandler, (result) => { callback(result) });
          break;

        //SEARCH INFO:
        case 'search_info':
          this.basicDialog(SearchInfoComponent, operationHandler, (result) => { callback(result) });
          break;

        //DICOM ACCESS:
        case 'dicom_access':
          this.basicDialog(DicomAccessComponent, operationHandler, (result) => { callback(result) });
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
  find(element: string, params: any, callback = (res: any) => {}, findOne: boolean = false, AditionalRequest: any = false, saveResponse: boolean = true): void {
    //Initialize operation type:
    let operation = 'find';

    //Check if findOne is true:
    if(findOne){ operation = 'findOne'; }

    //Check if AditionalRequest is true:
    //Only the users and stats modules uses this case [findByService or findByRoleInReport, Stat cases (appointments)]):
    if(AditionalRequest !== false && (
      AditionalRequest === 'findByService' || 
      AditionalRequest === 'findByRoleInReport' || 
      AditionalRequest === 'appointments' ||        // Stats case
      AditionalRequest === 'performing'             // Stats case
    )){ operation = AditionalRequest; }

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
  // SAVE MULTIPART - (INSERT & UPDATE):
  //--------------------------------------------------------------------------------------------------------------------//
  async saveMultipart(operation: string, element: string, _id: string, data: any, exceptions: Array<string> = [], fileHandler: any, callback = (res: any) => {}, saveResponse: boolean = true) {
    //Validate data - Delete empty fields:
    this.cleanEmptyFields(operation, data, exceptions);

    //Initializate File Max Size Controller:
    let fileMaxSizeError = false;
    
    //Add _id only for update case:
    if(operation == 'update' && _id != ''){
      data._id = _id;
    }

    //Check if element is not empty:
    if(element != ''){

      //Check if operation is not empty:
      if(operation != ''){
        //Create multipart form:
        const multipartForm = new FormData();

        //Set upload file in multipart form:
        await Promise.all(Object.keys(fileHandler).map((key) => {
          multipartForm.append(fileHandler[key].fileRequestKeyName, fileHandler[key].selectedFile, fileHandler[key].selectedFile.name);

          //Check max file size (current):
          if(this.bytesToMegaBytes(fileHandler[key].selectedFile.size) >= this.mainSettings.appSettings.file_max_size){ fileMaxSizeError = true; }
        }));

        //Set multipart form values:
        await Promise.all(Object.keys(data).map((key) => {
          multipartForm.append(key, data[key]);
        }));

        //Check max file size:
        if(fileMaxSizeError === false){
          //Save data:
          //Create observable obsSave:
          const obsSave = this.apiClient.sendRequest('POST', element + '/' + operation, multipartForm);

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
        } else{
          //Remove multipart form values:
          await Promise.all(Object.keys(data).map((key) => {
            multipartForm.delete(key);
          }));
  
          //Send cancelation message:
          this.sendMessage('El archivo que seleccióno excede el límite de tamaño máximo permitido (' + this.mainSettings.appSettings.file_max_size + ' MB).');
        }
      }
    } else {
      this.sendMessage('Error: Debe determinar el tipo de elemento.');
    }
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
          const formatted_date = this.accessionDateFormat(res.accession_date);

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
  // WEZEN STUDY TOKEN:
  //--------------------------------------------------------------------------------------------------------------------//
  wezenStudyToken(fk_performing: string, accessType: string = 'ohif', callback = (res: any) => {}): void {
    //Create observable obsFind:
    const obsFind = this.apiClient.sendRequest('GET', 'wezen/studyToken', { fk_performing: fk_performing, accessType });

    //Observe content (Subscribe):
    obsFind.subscribe({
      next: res => {
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
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ACCESSION NUMBER DATE FORMAT:
  //--------------------------------------------------------------------------------------------------------------------//
  accessionDateFormat(accession_date: string): any{
    return {
      year        : accession_date.slice(0, 4),
      month       : accession_date.slice(4, 6),
      day         : accession_date.slice(6, 8),
      hour        : accession_date.slice(8, 10),
      minute      : accession_date.slice(10, 12),
      second      : accession_date.slice(12, 14),
      milisecond  : accession_date.slice(14, 16)
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
    let password = this.mainSettings.passKeywords[this.getRandomNumber(0, this.mainSettings.passKeywords.length)];


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

    //Find by service selected role users (last parameter specific AditionalRequest):
    this.find('users', params, (res) => callback(res), false, 'findByService');
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
  MBqTomCi(MBq: number | string) {
    //Initializate result:
    let result: number = 0;

    //Check input value exist and concert:
    if(MBq !== undefined && MBq !== null){
      result = parseFloat(MBq.toString()) * 0.027027027027027;
    }

    //Return result:
    return result.toFixed(2);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // mCI to MBq:
  // Millicurie to Megabecquerel Conversion.
  //--------------------------------------------------------------------------------------------------------------------//
  mCiToMBq(mCi: number | string) {
    //Initializate result:
    let result = 0;

    //Check input value exist and concert:
    if(mCi !== undefined && mCi !== null){
      result = parseFloat(mCi.toString()) * 37;
    }

    //Return result:
    return result.toFixed(2);
  }
  //--------------------------------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------------------------------//
  // TABLE TO XLSX:
  //--------------------------------------------------------------------------------------------------------------------//
  async tableToXLSX(fileName: string, tableChild: any, excludedColumns: string[] = []){

    //console.log(tableChild.nativeElement.getElementsByTagName("TABLE")[0]);

    //Get timestamp:
    const timestamp = this.getTimeStamp();

    //Set sheet name:
    const sheetName = fileName.toLocaleUpperCase();

    //Get element table:
    const element_table = tableChild.nativeElement.getElementsByTagName("TABLE")[0];
    
    //Create workbook:
    // raw = If true, every cell will hold raw strings (Prevent Datetime format errors):
    const workbook = utils.table_to_book(element_table, { sheet: sheetName, raw: true });

    //Initializate remove leter index:
    let removeLettersIndex: string[] = [];

    //Delete exluded columns:
    await Promise.all(Object.keys(workbook.Sheets[sheetName]).map(async key => {
      //Check only necessary keys:
      if(typeof key == 'string' && key !== undefined && key !== null && key !== ''){
        //Extract numberic and letter parts of the key:
        const columnNumber = key.replace(/^\D+/g, '');
        const columnLetter = key.replace(/[^A-Za-z]/g, '');

        //Exclude rows, cols, ref and fullref objects:
        if(columnLetter !== 'rows' && columnLetter !== 'cols' && columnLetter !== 'ref' && columnLetter !== 'fullref'){
          //Check header column (First element in sheet index):
          if(columnNumber == '1'){
            if(excludedColumns.includes(workbook.Sheets[sheetName][key].v)){
              //Add column letter in remove leter index:
              removeLettersIndex.push(columnLetter);
            }
          }

          //Check that the letter column is found to delete:
          if(removeLettersIndex.includes(columnLetter)){
            delete workbook.Sheets[sheetName][key];
          }
        }
      }
    }));

    //Initialize alphabet array:
    const alphabetArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    //Obtain max number of rows from fullref property:
    let maxRows = workbook.Sheets[sheetName]['!fullref'];      // !fullref format: A1:H4
    maxRows = maxRows.split(':');                             // Split by ':' in array.
    maxRows = parseInt(maxRows[1].replace(/^\D+/g, ''), 10);  // Extract numberic part of the maxRows

    //Remove empty columns (reorder index):
    if(excludedColumns.length > 0){
      await Promise.all(Object.keys(workbook.Sheets[sheetName]).map(async key => {
        //Extract letter part of the key:
        const columnLetter = key.replace(/[^A-Za-z]/g, '');

        //Exclude rows, cols, ref and fullref objects:
        if(columnLetter !== 'rows' && columnLetter !== 'cols' && columnLetter !== 'ref' && columnLetter !== 'fullref'){

          //Await foreach of alphabet array:
          await Promise.all(Object.keys(alphabetArray).map(async (keyAlphabet: any) => {
            const compareValue = columnLetter.localeCompare(alphabetArray[keyAlphabet]);
            
            //Prevent undefined values for delete duplicates:
            if(workbook.Sheets[sheetName][key] !== undefined){

            //Check alphabetical compare order:
            if(compareValue == 1){
              //Move all elements with this key to previous index:
              const forLoop = async () => {
                for (let index = 1; index <= maxRows; index++){
                  //Move current element (previous index):
                  workbook.Sheets[sheetName][alphabetArray[keyAlphabet] + index] = workbook.Sheets[sheetName][columnLetter + index];

                  //Delete duplicated object in the workbook sheet:
                  delete workbook.Sheets[sheetName][columnLetter + index];
                }

                //Delete used letter from alphabet array:
                delete alphabetArray[keyAlphabet];
              }

              //Await forLoop:
              await forLoop();
            }
            }
          }));
        }
      }));
    }

    //Download .XLSX file:
    writeFileXLSX(workbook, timestamp + '_listado_' + fileName + '.xlsx');
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // JSON TO XLSX:
  //--------------------------------------------------------------------------------------------------------------------//
  async jsonToXLSX(json: any, filename: string = 'jsonResult'){
    //Create workbook:
    const workbook = utils.book_new();

    //Create worksheets with json object:
    await Promise.all(Object.keys(json).map(async key => {
      //Create worksheet:
      const worksheet = utils.json_to_sheet(json[key]);

      //Append current sheet to workbook:
      utils.book_append_sheet(workbook, worksheet, key);
    }));

    //Download .XLSX file:
    writeFileXLSX(workbook, filename + '.xlsx');
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // BYTES TO MEGABYTES:
  // Duplicated method to prevent circular dependency - [Duplicated method: api-client.service].
  //--------------------------------------------------------------------------------------------------------------------//
  bytesToMegaBytes(bytes: any): any {
    return bytes / (1024*1024);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DELETE FILE REF:
  // Delete file ref is only an update with unset file reference field.
  //--------------------------------------------------------------------------------------------------------------------//
  deleteFileRef(schemaName: string, _id: string, fieldName: string, callback = (res: any) => {}){
    //Create unset field value:
    let unset_field: any = {};
    unset_field[fieldName] = '';

    //Create observable obsUpdate:
    const obsUpdate = this.apiClient.sendRequest('POST', schemaName + '/update', { _id: _id, unset: unset_field });

    //Observe content (Subscribe):
    obsUpdate.subscribe({
      next: res => {
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
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // STRING TO BOOLEAN:
  // Duplicated methods - [Duplicated method: Backend - Main Services].
  //--------------------------------------------------------------------------------------------------------------------//
  stringToBoolean(string: string): boolean | undefined{
    if(string === 'true'){
        return true;
    } else if(string === 'false') {
        return false;
    } else {
        return undefined;
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // REPORT REVIEW:
  //--------------------------------------------------------------------------------------------------------------------//
  reportReview(fk_performing: string){
    //Initializate amendmentsData:
    let amendmentsData : any = false;

    //Set params:
    const params = {
      'filter[fk_performing]'       : fk_performing,

      //Project only report content, not performing content (multiple reports | amendments):
      'proj[clinical_info]'         : 1,
      'proj[procedure_description]' : 1,
      'proj[findings]'              : 1,
      'proj[summary]'               : 1,
      'proj[medical_signatures]'    : 1,
      'proj[authenticated]'         : 1,
      'proj[pathologies]'           : 1,
      'proj[createdAt]'             : 1,

      //Make sure the first report is the most recent:
      'sort[createdAt]'             : -1
    };

    //Find reports by fk_performing:
    this.find('reports', params, async (reportsRes) => {
      //Check operation status:
      if(reportsRes.success === true){
        //Check amend cases:
        if(this.getKeys(reportsRes.data, false, true).length > 1){
          //Set history report data object (Clone objects with spread operator):
          amendmentsData = [... reportsRes.data];

          //Delete current report from the history (first element):
          amendmentsData.shift();
        }

        //Create operation handler:
        const operationHandler = {
          last_report     : reportsRes.data[0], //Set report data with the last report (amend cases)
          amendments_data : amendmentsData
        };

        //Open dialog to decide what operation to perform:
        this.openDialog('report_review', operationHandler);

      } else {
        //Return to the list with request error message:
        this.sendMessage('Error al intentar revisar el informe: ' + reportsRes.message);
      }
    }, false, false, false);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND PREVIOUS:
  //--------------------------------------------------------------------------------------------------------------------//
  findPrevious(fk_patient: any, callback = (res: any) => {}){
    //Find prevoius performing:
    this.find('performing', { 'filter[patient._id]': fk_patient }, async (performingRes) => {
      //Check operation status:
      if(performingRes.success === true){
        //Execute callback:
        callback(performingRes.data);
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND PATHOLOGIES:
  //--------------------------------------------------------------------------------------------------------------------//
  findPathologies(fk_organization: string, callback = (res: any) => {}){
    //Initialize params:
    let params = {
      'filter[fk_organization]': fk_organization,
      'proj[name]': 1
    };

    //Find pathologies:
    this.find('pathologies', params, (pathologiesRes) => {
      //Execute callback:
      callback(pathologiesRes.data);
    }, false, false, false);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET AUTHENTICATED:
  //--------------------------------------------------------------------------------------------------------------------//
  async getAuthenticated(performingData: any, callback = (res: any) => {}){
    //Initializate authenticated performing array:
    let authenticatedPerforming: any = [];

    //Reset authenticated_performing (sharedFunctions Property):
    this.authenticated_performing = {};
    
    //Preserve performing _id to find authenticated reports (Await foreach):
    await Promise.all(Object.keys(performingData).map((key) => {
      if(performingData[key].flow_state === 'P09'){
        authenticatedPerforming.push(performingData[key]._id);
      }
    }));

    //Check authenticatedPerforming:
    if(authenticatedPerforming.length > 0){
      //Set params:
      let params: any = {
        //Project:
        'proj[fk_performing]'           : 1,

        //Project only authenticate content:
        'proj[authenticated.datetime]'  : 1,
        'proj[createdAt]'               : 1,

        //Make sure the first report is the most recent:
        'sort[createdAt]'               : -1
      };

      //Set fk_performing filter key:
      if(authenticatedPerforming.length == 1){
        params['filter[fk_performing]'] = authenticatedPerforming[0];
      } else {
        params['filter[in][fk_performing]'] = authenticatedPerforming;
      }

      //Find reports only one time for onSearch:
      return this.find('reports', params, async (reportsRes) => {
        //Check operation status:
        if(reportsRes.success === true){
          await Promise.all(Object.keys(reportsRes.data).map((key) => {
            //Check if an authentication already exists:
            //Preserve only the first occurrence (last sort) [amend cases].
            if(!this.authenticated_performing.hasOwnProperty(reportsRes.data[key].fk_performing)){
              //Set authenticated_performing:
              this.authenticated_performing[reportsRes.data[key].fk_performing] = reportsRes.data[key].authenticated.datetime;
            }
          }));
          

          //Execute callback:
          callback(reportsRes.data);
        } else {
          //Return to the list with request error message:
          this.sendMessage('Error al intentar revisar la autenticación del informe: ' + reportsRes.message);
        }
      }, false, false, false);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SORT OBJECT:
  //--------------------------------------------------------------------------------------------------------------------//
  async sortObject(data: any, exclude_keys: any = []){
    //Sort results by keys (await foreach):
    await Promise.all(Object.keys(data).map(async key => {

      //Check exclude keys and sort entries:
      if(!exclude_keys.includes(key)){
        data[key] = Object.fromEntries(Object.entries(data[key]).sort());
      }
    }));
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // CREATE OBJECT ID FUNCTION:
  //--------------------------------------------------------------------------------------------------------------------//
  getObjectId() {
    const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    const suffix = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase()
    return `${timestamp}${suffix}`;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET DAYS PASSED:
  //--------------------------------------------------------------------------------------------------------------------//
  getDaysPassed(date: string, second_date: any = undefined): any {
    //Convert the input date to a Date object and prevent TZ errors using the same time (T00:00:00.000Z):
    const startDate: Date = new Date(date.split('T')[0].slice(0) + 'T00:00:00.000Z');
    
    //Set second date:
    if(second_date === undefined || second_date === null || second_date === ''){
      //Get the current date:
      second_date = new Date();
    } else {
      //Prevent TZ errors using the same time (T00:00:00.000Z):
      second_date = second_date.split('T')[0].slice(0) + 'T00:00:00.000Z';
      second_date = new Date(second_date);
    }
    
    //Calculate the difference in milliseconds:
    const millisecondsDiff: number = second_date.getTime() - startDate.getTime();
    
    //Convert the difference from milliseconds to days:
    const millisecondsPerDay: number = 1000 * 60 * 60 * 24;
    let daysPassed: any = Math.floor(millisecondsDiff / millisecondsPerDay);
    
    //Check if daysPassed is zero (0 = false for IF):
    if(daysPassed == 0){
      daysPassed = 'zero';
    }
    
    return daysPassed;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ADD DAYS:
  //--------------------------------------------------------------------------------------------------------------------//
  addDays(date: string, days: number): string {
    const resultDate = new Date(date);
    resultDate.setDate(resultDate.getDate() + days);
    return resultDate.toISOString();
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // IS MAC:
  //--------------------------------------------------------------------------------------------------------------------//
  isMac(): boolean {
    return navigator.userAgent.includes('Mac');
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
