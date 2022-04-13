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
// VALIDATE FORMATTED PROJ:
// Validate and format MongoDB query projection.
//--------------------------------------------------------------------------------------------------------------------//
function validateFormattedProj(proj){
    //Initialize final projection variable:
    let formatted_proj = new Object();

    //Format data projection:
    if(proj && Object.keys(proj).length >= 1){
        Object.entries(proj).forEach(([key, value]) => {
            //Parse projection value (string) to integer (base 10):
            formatted_proj[key] = parseInt(value, 10);
        });

        //Return formatted projection:
        return formatted_proj;
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
function validateRequestID(req, res){
    //Validate the existence of the ID field in the request:
    if (!req.body.id && !req.query.id) {
        res.status(400).json({ success: false,  message: currentLang.db.empty_id });
        return false;
    } else {
        //Check that the entered ID is valid for MongoDB:
        if(mongoose.Types.ObjectId.isValid(req.body.id) || mongoose.Types.ObjectId.isValid(req.query.id)) {
            return true;
        } else {
            res.status(400).json({ success: false, message: currentLang.db.invalid_id });
            return false;
        }
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
// SEND CONSOLE MESSAGE:
// This function implements the verbose logging mode, sending information messages to the console.
//--------------------------------------------------------------------------------------------------------------------//
function sendConsoleMessage(req){
    console.log(req.method + ' request received [ ' + req.protocol + '://' + req.hostname + req.originalUrl + ' ] from ' + req.ip);
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
    //Set error message:
    const errorMessage = { success: false, message: message, error: error };

    //Send error message to console:
    console.error(errorMessage);

    //Return error message (HTML Response):
    res.status(500).send(errorMessage);
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
        //Send errors and details:
        console.error(error.message);
        console.log(error.details);
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export service module:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = {
    getFileSettings,
    removeItemFromArray,
    validateFormattedProj,
    validateRequestID,
    getSchemaKeys,
    sendConsoleMessage,
    getIPClient,
    hashPass,
    verifyPass,
    sendError,
    strictCheck
};
//--------------------------------------------------------------------------------------------------------------------//