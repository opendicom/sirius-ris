import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';                 // API Client Service
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { map } from 'rxjs/operators';                                                   // Reactive Extensions (RxJS)
import { regexObjectId } from '@env/environment';                                       // Enviroments

//PDF Make:
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

//HTML to PDF Make:
import htmlToPdfmake from 'html-to-pdfmake';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  //Inject services to the constructor:
  constructor(
    public sharedFunctions  : SharedFunctionsService,
    private apiClient   : ApiClientService,
  ) { }

  createPDF(type: string, _id: string, friendly_pass: string | undefined = undefined){
    //Initialize document:
    let docDefinition : any;

    //Check if friendly pass is accessible:
    if(friendly_pass === undefined){
      friendly_pass = 'La contraseña ya no es accesible.';
    }

    //Check _id:
    if(_id !== undefined && regexObjectId.test(_id)){

      //Set PDF document by type:
      switch(type){
        // PDF APPOINTMENT:
        case 'appointment':
          //Set params:
          const appointmentsParams = {
            'filter[_id]': _id,
            'proj[attached_files.base64]': 0,
            'proj[consents.informed_consent.base64]': 0,
            'proj[consents.clinical_trial.base64]': 0
          };

          //Find appointment by _id:
          //Use Api Client to prevent reload current list response [sharedFunctions.find -> this.response = res].
          const obsAppointment = this.apiClient.sendRequest('GET', 'appointments/find', appointmentsParams).pipe(
            map(async (res: any) => {
              //Check operation status:
              if(res.success === true){
                //FORMATING DATA:
                //Names:
                let names = res.data[0].patient.person.name_01;
                if(res.data[0].patient.person.name_02 !== '' && res.data[0].patient.person.name_02 !== undefined && res.data[0].patient.person.name_02 !== null){
                  names += ' ' + res.data[0].patient.person.name_02;
                }

                //Surnames:
                let surnames = res.data[0].patient.person.surname_01;
                if(res.data[0].patient.person.surname_02 !== '' && res.data[0].patient.person.surname_02 !== undefined && res.data[0].patient.person.surname_02 !== null){
                  surnames += ' ' + res.data[0].patient.person.surname_02;
                }

                //Start and End datetime:
                const datetime = this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].start), new Date(res.data[0].end));

                //Convert HTML to PDF Make syntax:
                let htmlPreparation = htmlToPdfmake('<p>El procedimiento a realizar <strong>NO posee preparación previa.</strong><p>');
                if(res.data[0].procedure.preparation !== undefined && res.data[0].procedure.preparation !== '' && res.data[0].procedure.preparation.length > 0){
                  htmlPreparation = htmlToPdfmake(res.data[0].procedure.preparation);
                }

                //Define document structure:
                docDefinition = {
                  content: [
                    // TÍTULO:
                    { text: 'COMPROBANTE DE CITA', style: 'header'},

                    // DATOS DE REALIZACIÓN:
                    {
                      style: 'main_table',
                      table: {
                        widths: ['*', '*', '*', '*'],
                        body: [
                          [{ text: 'REALIZACIÓN', colSpan: 4, style: 'header_table' }, {}, {}, {}],
                          [{ text: 'Organización', style: 'label_table' }, res.data[0].imaging.organization.short_name, { text: 'Fecha de cita', style: 'label_table' }, datetime.dateDay + '/' + datetime.dateMonth + '/' + datetime.dateYear ],
                          [{ text: 'Sucursal', style: 'label_table' }, res.data[0].imaging.branch.short_name, { text: 'Horario de cita', style: 'label_table' }, datetime.startHours + ':' + datetime.startMinutes + ' a ' + datetime.endHours + ':' + datetime.endMinutes + ' hs'],
                          [{ text: 'Servicio', style: 'label_table' }, res.data[0].imaging.service.name, { text: 'Procedimiento', style: 'label_table' }, res.data[0].procedure.name]
                        ]
                      }
                    },

                    // DATOS DEL PACIENTE:
                    {
                      style: 'main_table',
                      table: {
                        widths: ['*', '*'],
                        body: [
                          [{ text: 'PACIENTE', colSpan: 2, style: 'header_table' }, {}],
                          [{ text: 'Documento', style: 'label_table' }, res.data[0].patient.person.documents[0].document],
                          [{ text: 'Nombre/s', style: 'label_table' }, names],
                          [{ text: 'Apellido/s', style: 'label_table' }, surnames],
                          [{ text: 'Contraseña de acceso', style: 'label_table' }, friendly_pass]
                        ]
                      }
                    },

                    // PREPARACIÓN:
                    {
                      style: 'main_table',
                      table: {
                        widths: ['*'],
                        body: [
                          [{ text: 'PREPARACIÓN PREVIA', style: 'header_table' }],
                          [ htmlPreparation ]
                        ]
                      }
                    }
                  ],

                  //STYLES:
                  styles: {
                    header: {
                      margin: [0, 0, 0, 10],
                      fontSize: 18,
                      bold: true,
                      alignment: 'center'
                    },
                    main_table: {
                      margin: [0, 5, 0, 15],
                      fontSize: 11
                    },
                    header_table: {
                      fillColor: '#D3D4D8',
                      alignment: 'center',
                      bold: true
                    },
                    label_table: {
                      fillColor: '#E9E9EB'
                    }
                  }
                };

                //Get timestamp:
                const timestamp = this.sharedFunctions.getTimeStamp();

                //Create PDF and open in browser:
                pdfMake.createPdf(docDefinition).download(
                  timestamp + '_' +
                  res.data[0].patient.person.documents[0].document + '_' +
                  res.data[0].patient.person.name_01 + '_' +
                  res.data[0].patient.person.surname_01 +
                  '.pdf'
                );
              }

              //Return response:
              return res;
            })
          );

          //Observe content (Subscribe):
          obsAppointment.subscribe({
            next: (res: any) => {
              //Check operation status:
              if(res.success === false){
                this.sharedFunctions.sendMessage('Hubo un problema al intentar generar el PDF con el _id especificado. ' + res.message);
              }
            },
            error: res => {
              //Send snakbar message:
              if(res.error.message){
                //Check if have details error:
                if(res.error.error){
                  this.sharedFunctions.sendMessage(res.error.message + ' Error: ' + res.error.error);
                } else {
                  //Send other errors:
                  this.sharedFunctions.sendMessage(res.error.message);
                }
              } else {
                this.sharedFunctions.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
              }
            }
          });

        break;

        // PDF REPORT:
        case 'report':
          //Set params:
          const reportParams = {
            'filter[fk_performing]'       : _id,

            //Project only report content, not performing content (multiple reports | amendments):
            'proj[clinical_info]'         : 1,
            'proj[procedure_description]' : 1,
            'proj[findings]'              : 1,
            'proj[summary]'               : 1,
            'proj[medical_signatures]'    : 1,
            'proj[authenticated]'         : 1,

            //Make sure the first report is the most recent:
            'sort[createdAt]'             : -1
          };

          //Find report by _id:
          //Use Api Client to prevent reload current list response [sharedFunctions.find -> this.response = res].
          const obsReport = this.apiClient.sendRequest('GET', 'reports/find', reportParams).pipe(
          );
          break;
      }

    } else {
      //Send message:
      this.sharedFunctions.sendMessage('El _id especificado no es válido (No es ObjectId).');
    }
  }
}
