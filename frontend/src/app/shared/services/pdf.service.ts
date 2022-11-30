import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { regexObjectId } from '@env/environment';                                       // Enviroments
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  //Inject services to the constructor:
  constructor(
    public sharedFunctions  : SharedFunctionsService
  ) { }

  createPDF(type: string, _id: string, friendly_pass: string | undefined = undefined){
    //Initialize document:
    let docDefinition : any;

    //Check if friendly pass is accessible:
    if(friendly_pass === undefined){
      friendly_pass = 'La contraseña ya no es accesible.';
    }

    //Set PDF document by type:
    switch(type){
      // PDF APPOINTMENT:
      case 'appointment':
        if(_id !== undefined && regexObjectId.test(_id)){
          //Set params:
          const params = {
            'filter[_id]': _id,
            'proj[attached_files.base64]': 0,
            'proj[consents.informed_consent.base64]': 0,
            'proj[consents.clinical_trial.base64]': 0
          };

          //Find appointment by _id:
          this.sharedFunctions.find('appointments', params, (res) => {

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
                      [res.data[0].procedure.preparation]
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

          });
        } else {
          //Send message:
          this.sharedFunctions.sendMessage('El _id especificado no es válido (No es ObjectId).');
        }

        break;

      // PDF STUDY:
      case 'study':
        break;

      // PDF REPORT:
      case 'report':
        break;
    }
  }
}
