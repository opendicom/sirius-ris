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

//Import schemas:
const sessions  = require('../modules/sessions/schemas');
const logs      = require('../modules/logs/schemas');

//--------------------------------------------------------------------------------------------------------------------//
// CREATE SESSION:
//--------------------------------------------------------------------------------------------------------------------//
async function createSession(user_id, user_permission, res){
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
        //Create log object:
        const logObj = {
            event: 1,                   //Login
            datetime: creation_date,    //Same as payload iat
            fk_user: mongoose.Types.ObjectId(user_id),
        }

        //Create Mongoose object to insert validated data:
        const logData = new logs.Model(logObj);

        //Save registry in Log DB:
        await logData.save(logData)
        .then(async (savedLog) => {

            //Create JWT Session:
            const time_exp = '1d';

            //Create payload:
            const payload = {
                sub: user_id.toString(),       //Identify the subject of the token.
                iat: (creation_date / 1000),        //Token creation date.
                //exp: (Declared in expiresIn)      //Token expiration date.
                session: user_permission             //User permission for the session.
            }

            //Create JWT (Temp):
            jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: time_exp }, async (err, token) => {
                if(err){
                    //Send error:
                    mainServices.sendError(res, currentLang.jwt.sign_error, err);
                    
                    return;
                } else {
                    //Send successfully response:
                    res.status(200).send({ success: true, message: currentLang.auth.signin_success, token: token });
                }
            });

        //Log DB error:
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });
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