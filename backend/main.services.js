//--------------------------------------------------------------------------------------------------------------------//
// MAIN SERVICES:
// This file defines the functions of general use (Main services).
//--------------------------------------------------------------------------------------------------------------------//

//Import external modules:
const path      = require('path');
const fs        = require('fs');
const yaml      = require('js-yaml');
const mongoose  = require('mongoose');
const argon2    = require('argon2');

//Import app modules:
const mainSettings = getFileSettings();                                     // File settings (YAML)
const currentLang = require('./main.languages')(mainSettings.language);     // Language Module

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
        case 'INFO':
            if(level == 'INFO'){
                console.info('\n[ INFO ] ' + message);
                if(details){ console.info('[ INFO: Details ]'); console.info(details); }
            }
        case 'WARN':
            if(level == 'WARN'){
                console.warn('\n[ WARN ] ' + message);
                if(details){ console.warn('[ WARN: Details ]'); console.warn(details); }
            }
        case 'ERROR':
            if(level == 'ERROR'){
                console.error('\n[ ERROR ] ' + message);
                if(details){ console.error('[ ERROR: Details ]'); console.error(details); }
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
//--------------------------------------------------------------------------------------------------------------------//
function stringToBoolean(string){
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
    strictCheck
};
//--------------------------------------------------------------------------------------------------------------------//