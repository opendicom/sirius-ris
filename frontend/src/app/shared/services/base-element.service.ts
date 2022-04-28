import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';       // API Client Service
import { Observable } from 'rxjs';                                            // Reactive Extensions (RxJS)
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class BaseElementService {
  //Set class properties:
  public element: string = '';

  //Inject services to the constructor:
  constructor(private apiClient: ApiClientService) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // COLLECTION SETTER:
  //--------------------------------------------------------------------------------------------------------------------//
  setElement(element: string){
    this.element = element;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND:
  //--------------------------------------------------------------------------------------------------------------------//
  find(params: any, findOne: boolean = false): Observable<any>{
    //Return Observable:
    return new Observable<any>((observer) => {
      //Check if element is not empty:
      if(this.element != ''){
        //Initialize operation variable:
        let operation: string = '/find';

        //Determine type of operation:
        if(findOne === true){
          operation = '/findOne';
        }

        //Find:
        this.apiClient.getRequest(this.element + operation, params).subscribe({
          next: (data) => {
            //Pass chunks of data between observables:
            observer.next(data);
          },
          error: (error) => {
            observer.error(error);
          }
        });
      } else {
        observer.error('Error: Debe determinar el tipo de elemento.');
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND BY ID:
  //--------------------------------------------------------------------------------------------------------------------//
  findById(params: any): Observable<any>{
    //Return Observable:
    return new Observable<any>((observer) => {
      //Check if element is not empty:
      if(this.element != ''){
        //Find:
        this.apiClient.getRequest(this.element + '/findById', params).subscribe({
          next: (data) => {
            //Pass chunks of data between observables:
            observer.next(data);
          },
          error: (error) => {
            observer.error(error);
          }
        });
      } else {
        observer.error('Error: Debe determinar el tipo de elemento.');
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SAVE:
  //--------------------------------------------------------------------------------------------------------------------//
  save(action: string, data: any): Observable<any>{
    //Return Observable:
    return new Observable<any>((observer) => {
      //Check if element is not empty:
      if(this.element != ''){

        //Initialize operation variable:
        let operation: string = '';

        //Determine data flow according to action:
        switch(action){
          case 'new':
            operation = '/insert';
            break;
          case 'edit':
            //Update data:
            operation = '/update';
            break;
        }

        //Check if operation is not empty:
        if(operation != ''){
          //Save data:
          this.apiClient.postRequest(this.element + operation, data).subscribe({
            next: (data) => {
              //Pass chunks of data between observables:
              observer.next(data);
            },
            error: (error) => {
              observer.error(error);
            }
          });
        }
      } else {
        observer.error('Error: Debe determinar el tipo de elemento.');
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DELETE:
  //--------------------------------------------------------------------------------------------------------------------//
  delete(id: string): Observable<any>{
    //Return Observable:
    return new Observable<any>((observer) => {
      //Check if element is not empty:
      if(this.element != ''){
        //Save data:
        this.apiClient.postRequest(this.element + '/delete', {'id': id}).subscribe({
          next: (data) => {
            //Pass chunks of data between observables:
            observer.next(data);
          },
          error: (error) => {
            observer.error(error);
          }
        });
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
