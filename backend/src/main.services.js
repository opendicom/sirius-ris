//--------------------------------------------------------------------------------------------------------------------//
// MAIN SERVICES:
// This file defines the functions of general use (Main services).
//--------------------------------------------------------------------------------------------------------------------//

//Import external modules:
const path          = require('path');
const fs            = require('fs');
const yaml          = require('js-yaml');
const mongoose      = require('mongoose');
const argon2        = require('argon2');
const moment        = require('moment');
const multer        = require('multer');
const http          = require('http');
const xml2js        = require('xml2js');

//Import app modules:
const mainSettings  = getFileSettings();                                    // File settings (YAML)
const currentLang   = require('./main.languages')(mainSettings.language);   // Language Module

//--------------------------------------------------------------------------------------------------------------------//
// GET FILE SETTINGS:
// This function reads the settings file content (YAML) and returns it in an object.
//--------------------------------------------------------------------------------------------------------------------//
function getFileSettings(){
    //Read YAML settings file:
    try {
        let fileContents = fs.readFileSync(path.resolve('./', 'main.settings.yaml'), 'utf8');
        return yaml.load(fileContents);
    } catch (err) {
        console.log(currentLang.server.undefined_settings);
        console.error(err);
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// REMOVE ITEM FROM ARRAY:
// Function to remove elements from an array.
//--------------------------------------------------------------------------------------------------------------------//
function removeItemFromArray(array, item){
    let indice = array.indexOf(item);
    array.splice(indice, 1);
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// MONGODB OBJECT FORMAT PROJ:
// Validate and format MongoDB object to sort or projection.
//--------------------------------------------------------------------------------------------------------------------//
function mongoDBObjFormat(obj){
    //Initialize final projection variable:
    let formatted_obj = new Object();

    //Format data MongoDB object (sort & proj):
    if(obj && Object.keys(obj).length >= 1){
        Object.entries(obj).forEach(([key, value]) => {
            //Parse projection value (string) to integer (base 10):
            formatted_obj[key] = parseInt(value, 10);
        });

        //Return formatted projection:
        return formatted_obj;
    } else {
        //Return empty string:
        return '';
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATE REQUEST ID:
// Validate request ID (MongoID).
//--------------------------------------------------------------------------------------------------------------------//
function validateRequestID(id, res){
    //Check that the entered ID is valid for MongoDB:
    if(mongoose.Types.ObjectId.isValid(id)) {
        return true;
    } else {
        res.status(400).json({ success: false, message: currentLang.db.invalid_id });
        return false;
    }

}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// GET SCHEMA KEYS:
// This function obtain the keys of the current model, with or without modifiable elements.
// The notAllowedKeys (boolean, default false), parameter defines whether or not it will return the keys of the model
// that should NOT be modified manually.
//--------------------------------------------------------------------------------------------------------------------//
function getSchemaKeys(current, notAllowedKeys = false){
    //Get keys from current schema:
    //schemaKeys defines the list of modifiable elements of the object.
    const schemaKeys = Object.keys(current.Schema.paths);

    //Remove NON-modifiable elements. Only if requested:
    if(notAllowedKeys === true){
        removeItemFromArray(schemaKeys, '_id');
        removeItemFromArray(schemaKeys, 'updatedAt');
        removeItemFromArray(schemaKeys, 'createdAt');
        removeItemFromArray(schemaKeys, '__v');
    }
    //Return result:
    return schemaKeys;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// REQUEST RECEIVED:
//--------------------------------------------------------------------------------------------------------------------//
function reqReceived(req){
    return '\n' + req.method + ' request received \nurl: ' + req.protocol + '://' + req.hostname + req.originalUrl + ' \nfrom: ' + getIPClient(req);
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SEND CONSOLE MESSAGE:
//--------------------------------------------------------------------------------------------------------------------//
function sendConsoleMessage(level, message, details = false){
    switch(mainSettings.log_level){
        case 'DEBUG':
            if(level == 'DEBUG'){
                console.info('\n[ DEBUG | ' + moment().format('DD/MM/YYYY HH:mm:ss', { trim: false }) + ' ] ' + message);
                if(details){ console.info('\n[ DEBUG: Details ]'); console.debug(details); }
            }
        case 'INFO':
            if(level == 'INFO'){
                console.info('\n[ INFO | ' + moment().format('DD/MM/YYYY HH:mm:ss', { trim: false }) + ' ] ' + message);
                if(details){ console.info('\n[ INFO: Details ]'); console.info(details); }
            }
        case 'WARN':
            if(level == 'WARN'){
                console.warn('\n[ WARN | ' + moment().format('DD/MM/YYYY HH:mm:ss', { trim: false }) + ' ] ' + message);
                if(details){ console.warn('\n[ WARN: Details ]'); console.warn(details); }
            }
        case 'ERROR':
            if(level == 'ERROR'){
                console.error('\n[ ERROR | ' + moment().format('DD/MM/YYYY HH:mm:ss', { trim: false }) + ' ] ' + message);
                if(details){ console.error('\n[ ERROR: Details ]'); console.error(details); }
            }
            break;
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// GET IP CLIENT:
//--------------------------------------------------------------------------------------------------------------------//
function getIPClient(request) {
    let ip = request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;
    
    ip = ip.split(',')[0];

    //In case the IP returned in a format: "::ffff:146.xxx.xxx.xxx"
    ip = ip.split(':').slice(-1);

    //Return the IP:
    return ip[0];
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// HASH & VERIFY PASSWORD:
//--------------------------------------------------------------------------------------------------------------------//
async function hashPass(pass) {
    try {
        return await argon2.hash(pass);
    } catch (err) {
        return err;
    }
}

async function verifyPass(hash, password) {
    try {
        return await argon2.verify(hash, password);
    } catch (err) {
        return err;
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SEND ERROR:
//--------------------------------------------------------------------------------------------------------------------//
function sendError(res, message, error){
    //Send ERROR Message:
    sendConsoleMessage('ERROR', message, error);

    //Return error message (HTML Response):
    res.status(500).send({ success: false, message: message, error: error });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// STRING TO BOOLEAN:
// Duplicated methods - [Duplicated method: Frontend - Shared Functions Service].
//--------------------------------------------------------------------------------------------------------------------//
function stringToBoolean(string){
    if(string === 'true'){
        return true;
    } else if(string === 'false') {
        return false;
    } else if(string === true || false){
        return string; //Not string
    } else {
        return undefined;
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// PARSE DATE:
//--------------------------------------------------------------------------------------------------------------------//
function parseDate(input){
    let parts = input.match(/(\d+)/g);
    // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// STRICT CHECK:
//--------------------------------------------------------------------------------------------------------------------//
function strictCheck (proj, doc) {
    //Only if they are the find, findOne and findById methods:
    doc = doc.toObject()

    //Obtain keys and sort:
    let projKeys = Object.keys(proj).sort();
    let docKeys = Object.keys(doc).sort();

    //Remove _id automatic projection case:
    removeItemFromArray(docKeys, '_id');

    //Initialize error object:
    let error = {
        status: false,
        message: 'No hay errores',
        details: []
    };
    
    //Chequear que existan las mismas claves que las proyectadas:
    if(JSON.stringify(projKeys) == JSON.stringify(docKeys)){
        //Recorrer las claves del documento obtenido de la BD:
        for (currentKey in docKeys){
            //Chequear que los elementos del documento contengan valores:
            if(doc[docKeys[currentKey]] === undefined || doc[docKeys[currentKey]] === null || doc[docKeys[currentKey]] === ''){
                //Set error:
                error.status = true;
                error.message = 'Existen valores de la respuesta indefinidos, nulos o vacíos.'
                error.details.push(docKeys[currentKey] + ', NO puede ser indefinido, nulo ni vacío.');
            }
        }
    } else {
        //Set error:
        error.status = true;
        error.message = 'Existen diferencias entre los valores solicitados y los obtenidos desde la base de datos.';
        error.details.push('Pojected keys: ' + projKeys);
        error.details.push('Document keys: ' + docKeys);
    }

    //Return results:
    if(error.status){
        //Send ERROR Message:
        sendConsoleMessage('ERROR', error.message, error.details);
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// ADD ZERO & DATETIME FULLCALENDAR FORMATER:
// Duplicated methods - [Duplicated method: Frontend - SelectSlotComponent].
//--------------------------------------------------------------------------------------------------------------------//
function addZero(i) {
    if(i < 10){
        i = "0" + i.toString()
    }
    return i;
}

function datetimeFulCalendarFormater(start, end){
    //Date:
    const dateYear   = start.getFullYear();
    const dateMonth  = start.toLocaleString("es-AR", { month: "2-digit" });
    const dateDay    = start.toLocaleString("es-AR", { day: "2-digit" })

    //Start:
    const startHours    = addZero(start.getUTCHours());
    const startMinutes  = addZero(start.getUTCMinutes());

    //End:
    const endHours    = addZero(end.getUTCHours());
    const endMinutes  = addZero(end.getUTCMinutes());

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
// SET DICOM NAME PERSON FORMAT:
//--------------------------------------------------------------------------------------------------------------------//
function setDicomNamePersonFormat(name_01, name_02, surname_01, surname_02){
    //Initialize surnames and names:
    let surnames = '';
    let names = '';

    //Set Surnames:
    if(surname_02 !== undefined && surname_02 !== null && surname_02 !== ''){
        surnames = surname_01 + '>' + surname_02;
    } else {
        surnames = surname_01;
    }

    //Set Names:
    if(name_02 !== undefined && name_02 !== null && name_02 !== ''){
        names = name_01 + ' ' + name_02;
    } else {
        names = name_01;
    }

    //Return complete name in DICOM format:
    return surnames + '^' + names;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET STORAGE:
//--------------------------------------------------------------------------------------------------------------------//
function setStorage(){
    //Initializate filenames array:
    let filenames = [];

    //Return filenames:
    return multer.diskStorage({
        destination: (req, file, callback) => {
            //Set destination path:
            callback(null, 'uploads');
        },
        filename: (req, file, callback) => {
            //Create random simple hash:
            const baseChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let file_hash = '';
    
            for (let i=0; i<=10; i++){
                file_hash += baseChars[Math.round(Math.random() * baseChars.length)];
            }
            
            //Get file extension:
            const file_extension = file.originalname.split('.').pop();

            //Set current file name:
            const current_file_name = moment().format('YYYYMMDD_HHmmss', { trim: false }) + '_' + file_hash + '.' + file_extension;
            
            //Check filenames and reset:
            if(req.filenames === undefined){
                filenames = []; //Reset
            }

            //Add current file name in filenames array (multiple or single upload):
            filenames.push({
                fieldname: file.fieldname,      //origin fieldname in the req.body
                filename: current_file_name     //filename in storage (uploads)
            });

            //Clone filenames in the request:
            req.filenames = filenames;

            //Execute callback:
            callback(null, current_file_name);
        }
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// HTTP CLIENT GET REQUEST:
//--------------------------------------------------------------------------------------------------------------------//
async function httpClientGETRequest(path = '', callback = () => {}){
    //Create HTTP request:
    const request = http.get(path, (externalResponse) => {

        //Check status code:
        if (externalResponse.statusCode !== 200) {
            //Send DEBUG console message:
            sendConsoleMessage('DEBUG', 'Wezen return status code: ' + externalResponse.statusCode, externalResponse);
            externalResponse.resume();
            return;
        }
        
        //Handle response data:
        let data = '';
    
        //Set chunks of data:
        externalResponse.on('data', (chunk) => {
            data += chunk;
        });
    
        //On close response:
        externalResponse.on('close', () => {
            //Execute callback with complete data:
            callback(data);
        });
        
        //Handle external errors:
        request.on('error', (err) => {
            //Send WARN console message:
            sendConsoleMessage('WARN', 'Wezen error message: ' + err.message);
        });
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// XML STRING TO JSON:
//--------------------------------------------------------------------------------------------------------------------//
async function XMLStringToJSON(xml, callback = () => {}){
    //Create parser:
    const parser = new xml2js.Parser();
    
    //Parse XML a JSON:
    parser.parseString(xml, (err, result) => {
        //Handle errors:
        if (err) {
            //Send DEBUG console message:
            sendConsoleMessage('DEBUG', 'Error parsing XML: ' + err);
        } else {
            //Execute callback with complete data:
            callback(result);
        }
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export service module:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = {
    getFileSettings,
    removeItemFromArray,
    mongoDBObjFormat,
    validateRequestID,
    getSchemaKeys,
    reqReceived,
    sendConsoleMessage,
    getIPClient,
    hashPass,
    verifyPass,
    sendError,
    stringToBoolean,
    parseDate,
    strictCheck,
    datetimeFulCalendarFormater,
    setDicomNamePersonFormat,
    setStorage,
    httpClientGETRequest,
    XMLStringToJSON
};
//--------------------------------------------------------------------------------------------------------------------//