//--------------------------------------------------------------------------------------------------------------------//
// HL7 CLIENT HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mllp      = require('mllp-node');
const moment    = require('moment');
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import schemas:
const appointments = require('../../appointments/schemas');

//Create MLLP Server:
const server = new mllp.MLLPServer(mainSettings.mllp_server.host, mainSettings.mllp_server.port);

module.exports = async (req, res) => {
    //Import appointment aggregate:
    let appointment_aggregate = require('../aggregate');

    //Set match condition:
    const match = { "_id": mongoose.Types.ObjectId(req.body.fk_appointment) };

    //Add match if not exist operation to appointment aggregation:
    //42 is the number of objects inside the agregation array of objects.
    if(appointment_aggregate.length === 42){
        appointment_aggregate.push({ $match: match });  //Add
    } else {
        appointment_aggregate[42] = { $match: match };  //Replace current
    }

    //Find current appointment:
    await appointments.Model.aggregate(appointment_aggregate)
    .exec()
    .then((data) => {
        //Check if have results:
        if(data){
            //--------------------------------------------------------------------------------------------------------//
            // SET ORM FIELD VALUES:
            //--------------------------------------------------------------------------------------------------------//
            // Patient identifier [PID-3] (00100020):
            // First document:
            const ID = data[0].patient.person.documents[0].doc_country_code  + '.' + 
                       data[0].patient.person.documents[0].doc_type  + '.' + 
                       data[0].patient.person.documents[0].document;

            // ID issuer [PID-3.5] (00100021) <optional>:
            const II = '';

            // Patient name [PID-5] (00100010):
            // Name format: surname_01>surname_02^name_01 name_02
            const PN = mainServices.setDicomNamePersonFormat(data[0].patient.person.name_01, data[0].patient.person.name_02, data[0].patient.person.surname_01, data[0].patient.person.surname_02);

            // Patient birth date [PID-7] (00100030):
            // Date format: YYYYMMDD
            const patient_birth_date = JSON.stringify(data[0].patient.person.birth_date).split('T')[0].split('-');
            const PB = patient_birth_date[0].replace('"', '') + patient_birth_date[1] + patient_birth_date[2];

            // Patient sex [PID-8] (00100040):
            // Gender format: [M, F, O] -> If it is empty, M will be assigned.
            let PS = '';
            switch(data[0].patient.person.gender){
                case 1:
                    PS = 'M';
                    break;
                case 2:
                    PS = 'F';
                    break;
                case 3:
                    PS = 'O';
                    break;
            }

            // Referring physician (PV1-8, 00080090):
            // General practitioner.
            const RF = '';

            
            // Date time [ORC-7.4] (00400002,00400003):
            // Date time format: YYYYMMDDHHMM
            const DT = moment().format('YYYYMMDDHmm');

            // Procedure Priority HL7 codes:
            // S (Stat), A (ASAP), R (Routine), P (Pre-op), C (Callback), T (Timing).
            const PR = 'T';

            // SPS description / code [OBR-4.4] (00400007) [OBR-4.3+4+5] (00400008):
            // It is the description of the MWL item that will be seen in the console list.
            // If it is a single step, the value of Requesting Procedure Description: RP desc/code [OBR-44^2] (00321060) [OBR-4.1^2^3] (00321064).
            // Procedure Description, Steps.
            const SD = data[0].procedure.name;

            // Requesting Physician [OBR-16] (00321032) (Referring) Format (surname_01>surname_02^name_01 name_02)
            const RQ = '';

            // Accession number [OBR-18] (00080050):
            // 16 chars max.
            const AN = moment().format('YYYYMMDDHmmssSSSS');

            // Requested Procedure ID [OBR-19] (00401001) <optional>:
            // If empty, manages the PACS dcm4chee.
            const RP = '';

            // Scheduled step ID [OBR-20] (00400009) <optional>:
            const SS = '';
            
            // Scheduled station AET [OBR-21] (00400001) <optional>:
            // AET equipment.
            const AE = data[0].slot.equipment.AET;
            
            // Modality [OBR-24] (00080060) <code_value>:
            const MO = data[0].modality.code_value;

            // Performing Physician [OBR-34] (00400006) <reporting>:
            // organization_short_name^branch_short_name^surname_01>surname_02^name_01 name_02
            const reporting_user = mainServices.setDicomNamePersonFormat(data[0].reporting.fk_reporting.person.name_01, data[0].reporting.fk_reporting.person.name_02, data[0].reporting.fk_reporting.person.surname_01, data[0].reporting.fk_reporting.person.surname_02);
            const PP = data[0].reporting.organization.short_name + '^' + data[0].reporting.branch.short_name + '^' + reporting_user;

            // Requesting Procedure Description:
            // RP desc/code [OBR-44^2] (00321060) [OBR-4.1^2^3] (00321064):
            const RD = data[0].procedure.name;

            // UI studyUID [ZDS-1] (0020000D):
            const UI = data[0].study_iuid;
            //--------------------------------------------------------------------------------------------------------//

            //--------------------------------------------------------------------------------------------------------//
            // DUDAS:
            //--------------------------------------------------------------------------------------------------------//
            // 01. Contenido del primer segmento. ???
            //--------------------------------------------------------------------------------------------------------//
            // 02. Segmento faltante en el ejemplo:
            // Referring physician (PV1-8, 00080090):
            // Médico de cabecera. ???
            // PV1||||||||^${ RF }
            //--------------------------------------------------------------------------------------------------------//
            // 03. SD
            // Según .MD                    |^^SD|
            // Segun archivo de ejemplo:    |^^^kdkdkdff^TAC DE CRANEO^CT|
            // FALTA CONFIRMAR FORMA DEL CAMPO ???
            //--------------------------------------------------------------------------------------------------------//

            //Create HL7 Message:
            const HL7_message = `MSH|^~\\&|MUCAM AGENDA|MUCAM|MEGA DCMH4CHE|MUCAM|||ORM^O01|13668358090840.5981941519013931||2.3.1|||||UY|ISO_IR 100
            PID|||${ ID }^^^^${ II }||${ PN }||${ PB }|${ PS }
            ORC|NW||||||^^^${ DT }^^${ PR }||||||||||
            OBR||||^^${ SD }||||||||||||^${ RQ }||${ AN }|${ RP }|${ SS }|${ AE }|||${ MO }|||||||||^${ PP }||||||||||${ RD }
            ZDS|${ UI }`;

            const HL7_example = `MSH|^~\\&|MUCAM AGENDA|MUCAM|MEGA DCMH4CHE|MUCAM|||ORM^O01|13668358090840.5981941519013931||2.3.1|||||UY|ISO_IR 100
            PID|||777777^^^^2.16.840.1.113883.2.14.2.1||Castillo^Juan||19871024
            ORC|NW|2013424203649|||||^^^201304242036^^M~EDIUM||20130424203649||||||||MUCAM
            OBR||987861||^^^kdkdkdff^TAC DE CRANEO^CT||||||||||||||987861|1|||||CT|||^^^201111301500
            ZDS|987861`;

            //Send HL7 message to PACS server (MWL):
            /*
            server.send(mainSettings.pacs.host, mainSettings.pacs.mllp_mwl, HL7_example, (error, ack) => {
                //Check errors:
                if(error){
                    //Send ERROR Message:
                    mainServices.sendConsoleMessage('ERROR', currentLang.ris.mwl_error, error);

                    //Return error message (HTML Response):
                    res.status(500).send({ success: false, message: currentLang.ris.mwl_error, error: error });
                } else {
                    //Send DEBUG Message:
                    mainServices.sendConsoleMessage('DEBUG', '\nMWL HL7 sended [ACK received]', ack);

                    //Send successfully response:
                    res.status(200).send({ success: true, message: currentLang.ris.mwl_success, accession_number: AN, ack: ack, hl7: HL7_message });
                }
            });
            */
        
            //Send successfully response:
            res.status(200).send({ success: true, accession_number: AN, hl7: HL7_message, example: HL7_example, appointment: data });
        } else {
            //No data (empty result):
            res.status(200).send({ success: false, message: currentLang.ris.mwl_error, error: currentLang.db.query_no_data });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//