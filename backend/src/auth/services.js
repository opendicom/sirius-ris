//--------------------------------------------------------------------------------------------------------------------//
// AUTH SERVICES:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const jwt       = require('jsonwebtoken');
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../main.services');                          // Main services
const mainSettings  = mainServices.getFileSettings();                       // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);  // Language Module

//Import Module Services:
const moduleServices = require('../modules/modules.services');

//Import schemas:
const sessions  = require('../modules/sessions/schemas');

//--------------------------------------------------------------------------------------------------------------------//
// CREATE SESSION:
//--------------------------------------------------------------------------------------------------------------------//
async function createSession(user_id, user_permission, req, res, response_data = false){
    //Set creation date:
    const creation_date = Date.now();

    //Create session object:
    const sessionObj = {
        start: creation_date,                       //Same as payload iat
        fk_user: mongoose.Types.ObjectId(user_id),  //Cast to ObjectId
        current_access: user_permission
    };

    //Create Mongoose object to insert validated data:
    const sessionData = new sessions.Model(sessionObj);

    //Save session in DB:
    await sessionData.save(sessionData)
    .then(async (savedSession) => {
        //Save registry in Log DB:
        const logResult = await moduleServices.insertLog(req, res, 1, undefined, user_id, user_permission);

        //Check log registry result:
        if(logResult){
            //Create JWT Session:
            const time_exp = '1d';

            //Create payload:
            const payload = {
                sub: user_id.toString(),            //Identify the subject of the token.
                iat: (creation_date / 1000),        //Token creation date.
                //exp: (Declared in expiresIn)      //Token expiration date.
                session: user_permission            //User permission for the session.
            }

            //Create JWT (Temp):
            jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: time_exp }, async (err, token) => {
                if(err){
                    //Send error:
                    mainServices.sendError(res, currentLang.jwt.sign_error, err);
                    
                    return;
                } else {
                    //Check if user information should be added (signin with only one permission case):
                    if(response_data){
                        //Send successfully response:
                        res.status(200).send({ success: true, message: currentLang.auth.signin_success, data: response_data, token: token });
                    } else {
                        //Send successfully response:
                        res.status(200).send({ success: true, message: currentLang.auth.signin_success, token: token });
                    }
                    
                }
            });
        }
    //Session DB error:
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export service module:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = {
    createSession
};
//--------------------------------------------------------------------------------------------------------------------//