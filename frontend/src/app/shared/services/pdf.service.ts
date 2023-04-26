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
  //Initializate logo Data URI:
  public logoDataURI = 'data:image/jpeg;base64,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';

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
                    // HEADER IMAGE:
                    {
                      image: 'logo',
                      width: 125,
                      alignment: 'center',
                      margin: [0, -25, 0, 10],
                      opacity: 0.8
                    },

                    // TITLE:
                    { text: 'Comprobante de cita:', style: 'header'},

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
                          [{ text: htmlPreparation, style: 'paragraph' } ]
                        ]
                      }
                    }
                  ],

                  //IMAGES:
                  images: {
                    logo: this.logoDataURI
                  },

                  //STYLES:
                  styles: {
                    header: {
                      margin: [0, 0, 0, 10],
                      fontSize: 13,
                      bold: true,
                      decoration: 'underline'
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
                    },
                    paragraph: {
                      fontSize: 10
                    },
                  }
                };

                //Get timestamp:
                const timestamp = this.sharedFunctions.getTimeStamp();

                //Create PDF and open in browser:
                pdfMake.createPdf(docDefinition).download(
                  timestamp + '_CITA_' +
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

            //Project report content:
            'proj[clinical_info]'           : 1,
            'proj[procedure_description]'   : 1,
            'proj[findings]'                : 1,
            'proj[summary]'                 : 1,
            'proj[medical_signatures.user]' : 1,
            'proj[authenticated]'           : 1,
            'proj[createdAt]'               : 1,

            //Project performing content:
            'proj[performing.date]'         : 1,
            'proj[procedure.name]'          : 1,
            
            //Appointment content:
            'proj[appointment.imaging.organization]' : 1,

            //Project patient content:
            'proj[patient]'                 : 1,

            //Make sure the first report is the most recent:
            'sort[createdAt]'               : -1
          };

          //Find report by _id:
          //Use Api Client to prevent reload current list response [sharedFunctions.find -> this.response = res].
          const obsReport = this.apiClient.sendRequest('GET', 'reports/findOne', reportParams).pipe(
            map(async (res: any) => {
              //Check operation status:
              if(res.success === true){
                //FORMATING DATA:
                //Patient Names:
                let patient_names = res.data[0].patient.person.name_01;
                if(res.data[0].patient.person.name_02 !== '' && res.data[0].patient.person.name_02 !== undefined && res.data[0].patient.person.name_02 !== null){
                  patient_names += ' ' + res.data[0].patient.person.name_02;
                }

                //Patient Surnames:
                let patient_surnames = res.data[0].patient.person.surname_01;
                if(res.data[0].patient.person.surname_02 !== '' && res.data[0].patient.person.surname_02 !== undefined && res.data[0].patient.person.surname_02 !== null){
                  patient_surnames += ' ' + res.data[0].patient.person.surname_02;
                }

                //Complete patient name:
                const patient_complete_name = patient_names + ' ' + patient_surnames;

                //Datetime:
                const datetime = this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].performing.date), new Date(res.data[0].performing.date));
                const performing_datetime = datetime.dateDay + '/' + datetime.dateMonth + '/' + datetime.dateYear + ' ' + datetime.startHours + ':' + datetime.startMinutes + ' hs';

                //Auth user Names:
                let auth_names = res.data[0].authenticated.user.person.name_01;
                if(res.data[0].authenticated.user.person.name_02 !== '' && res.data[0].authenticated.user.person.name_02 !== undefined && res.data[0].authenticated.user.person.name_02 !== null){
                  auth_names += ' ' + res.data[0].authenticated.user.person.name_02;
                }

                //Auth user Surnames:
                let auth_surnames = res.data[0].authenticated.user.person.surname_01;
                if(res.data[0].authenticated.user.person.surname_02 !== '' && res.data[0].authenticated.user.person.surname_02 !== undefined && res.data[0].authenticated.user.person.surname_02 !== null){
                  auth_surnames += ' ' + res.data[0].authenticated.user.person.surname_02;
                }

                //Complete Auth user name:
                const auth_complete_name = auth_names + ' ' + auth_surnames;

                //Authenticate message:
                const authMessage = 'Autenticado digitalmente por ' + auth_complete_name + ' en fecha del ' + res.data[0].authenticated.datetime + ' actuando para la institución ' + res.data[0].appointment.imaging.organization.name + ' con OID ' + res.data[0].appointment.imaging.organization.OID;

                //Medical signatures (await foreach):
                let signatures_users = '';
                await Promise.all(Object.keys(res.data[0].medical_signatures).map((key) => {
                  //Signatures user Names:
                  let signature_names = res.data[0].medical_signatures[key].user.person.name_01;
                  if(res.data[0].medical_signatures[key].user.person.name_02 !== '' && res.data[0].medical_signatures[key].user.person.name_02 !== undefined && res.data[0].medical_signatures[key].user.person.name_02 !== null){
                    signature_names += ' ' + res.data[0].medical_signatures[key].user.person.name_02;
                  }

                  //Signatures user Surnames:
                  let signature_surnames = res.data[0].medical_signatures[key].user.person.surname_01;
                  if(res.data[0].medical_signatures[key].user.person.surname_02 !== '' && res.data[0].medical_signatures[key].user.person.surname_02 !== undefined && res.data[0].medical_signatures[key].user.person.surname_02 !== null){
                    signature_surnames += ' ' + res.data[0].medical_signatures[key].user.person.surname_02;
                  }

                  //Complete Auth user name:
                  const signature_complete_name = signature_names + ' ' + signature_surnames;

                  //Concat signature users:
                  signatures_users += signature_complete_name + ', ';
                }));

                //Signatures message:
                const signMessage = 'Firmado por médico/s: ' + signatures_users.substring(0, signatures_users.length - 2) + ' | ' + res.data[0].appointment.imaging.organization.short_name;

                //Convert HTML to PDF Make syntax:
                let htmlClinicalInfo = htmlToPdfmake('<p>El informe <strong>NO posee dato clínico.</strong><p>');
                if(res.data[0].clinical_info !== undefined && res.data[0].clinical_info !== null && res.data[0].clinical_info !== ''){
                  htmlClinicalInfo = htmlToPdfmake(res.data[0].clinical_info);
                }

                let htmlProcedureDescription = htmlToPdfmake('<p>El informe <strong>NO posee dato clínico.</strong><p>');
                if(res.data[0].procedure_description !== undefined && res.data[0].procedure_description !== null && res.data[0].procedure_description !== ''){
                  htmlProcedureDescription = htmlToPdfmake(res.data[0].procedure_description);
                }

                
                let htmlFindings = htmlToPdfmake('<p>El informe <strong>NO posee hallazgos.</strong><p>');
                if(res.data[0].findings[0].procedure_findings !== undefined && res.data[0].findings[0].procedure_findings !== null && res.data[0].findings[0].procedure_findings !== ''){
                  htmlFindings = htmlToPdfmake(res.data[0].findings[0].procedure_findings);
                }

                let htmlSummary = htmlToPdfmake('<p>El informe <strong>NO posee en suma.</strong><p>');
                if(res.data[0].summary !== undefined && res.data[0].summary !== null && res.data[0].summary !== ''){
                  htmlSummary = htmlToPdfmake(res.data[0].summary);
                }

                //Findings title:
                const findingsTitle = res.data[0].findings[0].title + ':';

                //Define document structure:
                docDefinition = {
                  content: [
                    // HEADER IMAGE:
                    {
                      image: 'logo',
                      width: 125,
                      alignment: 'center',
                      margin: [0, -25, 0, 10],
                      opacity: 0.8
                    },
                        
                    // PERFORMING DATA:
                    {
                      type: 'none',
                      ol: [
                        { text: patient_complete_name, bold: true },
                        res.data[0].patient.person.documents[0].document,
                        res.data[0].procedure.name,
                        performing_datetime
                      ],
                      style: 'performing_data',
                    },
                    
                    // SEPARATOR LINE:
                    { canvas: [ { type: 'line', lineColor: '#777777', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 } ] },
                        
                    // CLINICAL INFO:
                    {
                      text: 'Dato clínico:',
                      style: 'subheader',
                      margin: [0, 10, 0, 0]
                    },
                    {
                      text: htmlClinicalInfo,
                      style: 'paragraph'
                    },
                    
                    '\n',
                    
                    // PROCEDURE:
                    {
                      text: 'Procedimiento:',
                      style: 'subheader'
                    },
                    {
                      text: htmlProcedureDescription,
                      style: 'paragraph'
                    },
                    
                    '\n',
                    
                    // FINDINGS:
                    {
                      text: findingsTitle,
                      style: 'subheader'
                    },
                    {
                      text: htmlFindings,
                      style: 'paragraph'
                    },
                    
                    '\n',
                    
                    // SUMMARY:
                    {
                      text: 'En suma:',
                      style: 'subheader'
                    },
                    {
                      text: htmlSummary,
                      style: 'paragraph'
                    },
                        
                    '\n\n',
                        
                    //SEPARATOR LINE:
                    { canvas: [ { type: 'line', lineColor: '#777777', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 } ] },
                        
                    //SIGNATURES:
                    {
                      text: signMessage,
                      style: 'sign_auth',
                      margin: [0, 3, 0, 0]
                    },
                        
                    //AUTHENTICATION:
                    {
                      text: authMessage,
                      style: 'sign_auth'
                    }
                  ],
                  
                  //IMAGES:
                  images: {
                    logo: this.logoDataURI
                  },
                  
                  //STYLES:
                  styles: {
                    header: {
                        margin: [0, 0, 0, 10],
                        fontSize: 14,
                        bold: true,
                        alignment: 'center'
                    },
                    subheader: {
                        fontSize: 12,
                        bold: true,
                        decoration: 'underline'
                    },
                    paragraph: {
                      fontSize: 10
                    },
                    sign_auth: {
                      fontSize: 8
                    },
                    performing_data: {
                      margin: [-11, 0, 0, 9],
                      fontSize: 9
                    }
                  }
                };
              }

              //Get timestamp:
              const timestamp = this.sharedFunctions.getTimeStamp();

              //Create PDF and open in browser:
              pdfMake.createPdf(docDefinition).download(
                timestamp + '_INFORME_' +
                res.data[0].patient.person.documents[0].document + '_' +
                res.data[0].patient.person.name_01 + '_' +
                res.data[0].patient.person.surname_01 +
                '.pdf'
              );

              //Return response:
              return res;
            })
          );

          //Observe content (Subscribe):
          obsReport.subscribe();
          break;
      }

    } else {
      //Send message:
      this.sharedFunctions.sendMessage('El _id especificado no es válido (No es ObjectId).');
    }
  }
}
