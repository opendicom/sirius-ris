//--------------------------------------------------------------------------------------------------------------------//
// ORGANIZATIONS SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const cryptoJS = require('crypto-js');

//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema, operation) => {
    //Set base64 upload files in the request:
    await moduleServices.setBase64Files(req, operation);

    //Execute main query:
    switch(operation){
        case 'insert':
            //Check if body has the password_cert field:
            if(req.body.password_cert !== undefined && req.body.password_cert !== null && req.body.password_cert !== ''){
                //Encrypt certificate key with JWT secret:
                req.body.password_cert = cryptoJS.AES.encrypt(req.body.password_cert, mainSettings.AUTH_JWT_SECRET).toString();
            }

            //Save data:
            await moduleServices.insert(req, res, currentSchema);
            break;
        case 'update':
            //Check if the requests has the password_cert field:
            if(req.validatedResult.set.password_cert !== undefined && req.validatedResult.set.password_cert !== null && req.validatedResult.set.password_cert !== ''){
                //Encrypt certificate key with JWT secret:
                req.validatedResult.set.password_cert = cryptoJS.AES.encrypt(req.validatedResult.set.password_cert, mainSettings.AUTH_JWT_SECRET).toString();
            }
            
            //Save data:
            await moduleServices.update(req, res, currentSchema);
            break;
        default:
            res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
            break;
    }
}
//--------------------------------------------------------------------------------------------------------------------//