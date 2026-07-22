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

            //Convert the flat "white_labeling.label" key sent by the form into a nested field:
            if(req.body['white_labeling.label'] !== undefined && req.body['white_labeling.label'] !== null && req.body['white_labeling.label'] !== ''){
                if(!req.body.white_labeling){ req.body.white_labeling = {}; }
                req.body.white_labeling.label = req.body['white_labeling.label'];
                delete req.body['white_labeling.label'];
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

            //white_labeling.label may be rejected by the generic field validator, so set it explicitly:
            if(req.body['white_labeling.label'] !== undefined && req.body['white_labeling.label'] !== null && req.body['white_labeling.label'] !== ''){
                if(req.validatedResult.set === false){ req.validatedResult.set = {}; }
                req.validatedResult.set['white_labeling.label'] = req.body['white_labeling.label'];
                //Remove from blocked list to avoid a misleading UI message:
                if(req.validatedResult.blocked && req.validatedResult.blocked['white_labeling.label'] !== undefined){
                    delete req.validatedResult.blocked['white_labeling.label'];
                }
            }

            //Convert the flat "unset.white_labeling.label" marker into an actual field removal:
            if(req.body['unset.white_labeling.label'] !== undefined){
                if(!req.validatedResult.unset){ req.validatedResult.unset = {}; }
                req.validatedResult.unset['white_labeling.label'] = '';
                //Remove from blocked list to avoid a misleading UI message:
                if(req.validatedResult.blocked && req.validatedResult.blocked['unset.white_labeling.label'] !== undefined){
                    delete req.validatedResult.blocked['unset.white_labeling.label'];
                }
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