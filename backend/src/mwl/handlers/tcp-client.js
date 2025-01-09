//--------------------------------------------------------------------------------------------------------------------//
// HL7 CLIENT HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const net       = require('net');
const moment    = require('moment');
const mongoose  = require('mongoose');
const cryptojs  = require("crypto-js");

//Import app modules:
const mainServices  = require('../../main.services');                               // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);       // Language Module

//Import Module Services:
const moduleServices = require('../../modules/modules.services');

//Import schemas:
const appointments = require('../../modules/appointments/schemas');

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
            const ID = data[0].patient.person.documents[0].document;

            // ID issuer [PID-3.5] (00100021):
            // Document type according to the organization in charge of the digital medical history repository of the region.
            const II = moduleServices.setIDIssuer(data[0].reporting.organization.country_code, data[0].patient.person.documents[0].doc_country_code, data[0].patient.person.documents[0].doc_type);

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

            // Referring physician (PV1-8, 00080090) <optional>:
            // General practitioner.
            // PV1||||||||^RF  <optional segment>
            const RF = '';
            
            // Date time [ORC-7.4] (00400002,00400003):
            // Date time format: YYYYMMDDHHMM
            const DT = moment().format('YYYYMMDDHHmm', { trim: false }); //Trim false to keep leading zeros.

            // Procedure Priority HL7 codes:
            // S (Stat), A (ASAP), R (Routine), P (Pre-op), C (Callback), T (Timing).
            const PR = 'T';

            // SPS description / code [OBR-4.4] (00400007) [OBR-4.3+4+5] (00400008):
            // It is the description of the MWL item that will be seen in the console list.
            // If it is a single step, the value of Requesting Procedure Description: RP desc/code [OBR-44^2] (00321060) [OBR-4.1^2^3] (00321064).
            // Procedure Description, Steps.
            const SD = data[0].procedure.name;
            

            // Procedure Description ID, Steps (00080100) [Code Value]:
            let SD_CODE = '-';
            if(data[0].procedure.code) { SD_CODE = data[0].procedure.code; }

            // Coding Scheme Designator (0008,0102) <optional>:
            // Identifies the coding scheme in which the code for a term is defined.
            // Standard coding scheme designators used in DICOM information interchange are listed in PS3.
            const CSD = '';

            // Requesting Physician [OBR-16] (00321032) (Referring) Format (surname_01>surname_02^name_01 name_02)
            const RQ = '';

            // Accession number [OBR-18] (00080050):
            // 16 chars max.
            // Use four digits for Fractional Seconds to prevent repetitions.
            const AN = data[0].accession_number;

            // Set accession date (Last shipment date to MWL):
            const accession_date = moment().format('YYYYMMDDHHmmssSS', { trim: false }); //Trim false to keep leading zeros.

            // Requested Procedure ID [OBR-19] (00401001):
            // req_proc_id: cannot be null | 16 chars max:
            const RP = cryptojs.HmacSHA1("00401001", data[0].procedure._id.toString()).toString().slice(0,16); //Generate unique hash (fixed length) with procedure _id.

            // Scheduled step ID [OBR-20] (00400009) <optional>:
            const SS = '';
            
            // Scheduled station AET [OBR-21] (00400001) <optional>:
            // AET equipment.
            const AE = data[0].slot.equipment.AET;

            // Scheduled Station Name (0040,0010) <optional>:
            // The first component of this field is a string that identifies the particular piece of equipment. 
            const SSN = data[0].slot.equipment.name;
            
            // Modality [OBR-24] (00080060) <code_value>:
            const MO = data[0].modality.code_value;

            // Performing Physician [OBR-34] (00400006) <reporting>:
            // organization_short_name^branch_short_name^surname_01>surname_02^name_01 name_02
            let reporting_user = '';
            if(data[0].reporting.fk_reporting !== undefined && data[0].reporting.fk_reporting !== null && data[0].reporting.fk_reporting !== ''){
                reporting_user = mainServices.setDicomNamePersonFormat(data[0].reporting.fk_reporting.person.name_01, data[0].reporting.fk_reporting.person.name_02, data[0].reporting.fk_reporting.person.surname_01, data[0].reporting.fk_reporting.person.surname_02);
            } else {
                reporting_user = '*';
            }
            
            const PP = data[0].reporting.organization.short_name + '^' + data[0].reporting.branch.short_name + '^' + reporting_user;

            // Requesting Procedure Description:
            // RP desc/code [OBR-44^2] (00321060) [OBR-4.1^2^3] (00321064):
            const RD = data[0].procedure.name;

            // UI studyUID [ZDS-1] (0020000D):
            const UI = data[0].study_iuid;

            // Requesting Service (00321033) [ORC-17] <referring organization>:
            // organization_short_name^branch_short_name^service_name^referring_surname_01>referring_surname_02^refferring_name_01 refferring_name_02
            let RS = data[0].referring.organization.short_name;

            //Check referring branch:
            if(data[0].referring.branch !== undefined && data[0].referring.branch !== null && data[0].referring.branch !== ''){
                if(data[0].referring.branch.short_name !== undefined && data[0].referring.branch.short_name !== null && data[0].referring.branch.short_name !== ''){
                    RS+= '^' + data[0].referring.branch.short_name;
                }
            }

            //Check referring service:
            if(data[0].referring.service !== undefined && data[0].referring.service !== null && data[0].referring.service !== ''){
                if(data[0].referring.service.name !== undefined && data[0].referring.service.name !== null && data[0].referring.service.name !== ''){
                    RS+= '^' + data[0].referring.service.name;
                }
            }

            // Institution Name Attribute (00080080) <imaging>:
            // organization_short_name^branch_short_name^service_name
            let INA = data[0].imaging.organization.short_name;

            //Check imaging branch:
            if(data[0].imaging.branch !== undefined && data[0].imaging.branch !== null && data[0].imaging.branch !== ''){
                if(data[0].imaging.branch.short_name !== undefined && data[0].imaging.branch.short_name !== null && data[0].imaging.branch.short_name !== ''){
                    INA+= '^' + data[0].imaging.branch.short_name;
                }
            }

            //Check imaging service:
            if(data[0].imaging.service !== undefined && data[0].imaging.service !== null && data[0].imaging.service !== ''){
                if(data[0].imaging.service.name !== undefined && data[0].imaging.service.name !== null && data[0].imaging.service.name !== ''){
                    INA+= '^' + data[0].imaging.service.name;
                }
            }
            //--------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// CREATE HL7 MESSAGE:
// Create message without indentation to avoid sending text tabs.
//--------------------------------------------------------------------------------------------------------------------//
const HL7_message = `MSH|^~\\&|||||||ORM^O01|||2.3.1
IPC|||||||${ SSN }^^^
PID|||${ ID }^^^${ II }||${ PN }||${ PB }|${ PS }
ORC|NW||||||^^^${ DT }^^${ PR }||||||||||${ RS }
OBR||||^^^${ SD_CODE }^${ SD }^${ CSD }||||||||||||^${ RQ }||${ AN }|${ RP }|${ SS }|${ AE }|||${ MO }||||||||||${ PP }||||||||||${ RD }
PV1||||||||${ RS }
ZDS|${ UI }`;
//--------------------------------------------------------------------------------------------------------------------//


            //--------------------------------------------------------------------------------------------------------//
            // TCP CLIENT CONNECTION:
            //--------------------------------------------------------------------------------------------------------//
            //Set destination server params:
            const destinationServerTCP = {
                port: mainSettings.pacs.port_mllp,
                host: mainSettings.pacs.host
            };

            // HL7 Structure:
            // Header + HL7 Message + Trailer + Carriage Return.
            // VT : Vertical tab character (0x0b).
            // FS : The trailer is a Field Separator character (0x1c).
            // CR : Carriage return (0x0d).
            const VT = String.fromCharCode(0x0b);
            const FS = String.fromCharCode(0x1c);
            const CR = String.fromCharCode(0x0d);

            //Create TCP client:
            const client = net.createConnection(destinationServerTCP);

            //Establish connection with TCP server:
            client.on('connect', async () => {
                //Send HL7 message to PACS server vía TCP (MLLP) encoded in latin1 (MWL send):
                client.write(VT + HL7_message + FS + CR, 'latin1');

                //Close connection (End communication):
                client.end();

                //Add accession_date to appointment (update appointment):
                await appointments.Model.findOneAndUpdate({ _id: req.body.fk_appointment }, { 'accession_date': accession_date }, { new: true })
                .then(async (data) => {
                    //Check if have results:
                    if(data) {
                        //Send DEBUG Message:
                        mainServices.sendConsoleMessage('DEBUG', '\nMWL HL7 sended [accession_date]: ' + accession_date);

                        //Send successfully response:
                        res.status(200).send({ success: true, message: currentLang.ris.mwl_success, accession_date: accession_date, hl7: HL7_message });
                    } else {
                        //Dont match (empty result):
                        res.status(200).send({ success: false,  message: currentLang.ris.mwl_error, error: currentLang.db.id_no_results });
                    }
                })
                .catch((err) => {
                    //Send DB error:
                    mainServices.sendError(res, currentLang.db.update_error, err);
                });
            });

            //Handle errors:
            client.on('error', (error) => {
                //Send ERROR Message:
                mainServices.sendConsoleMessage('ERROR', currentLang.ris.mwl_error, error.message);

                //Return error message (HTML Response):
                res.status(500).send({ success: false, message: currentLang.ris.mwl_error, error: error.message });
            });
            //--------------------------------------------------------------------------------------------------------//


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
