//--------------------------------------------------------------------------------------------------------------------//
// SINGIN HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const jwt       = require('jsonwebtoken');
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Import schemas:
const users     = require('../../modules/users/schemas');
const sessions  = require('../../modules/sessions/schemas');
const logs      = require('../../modules/logs/schemas');

module.exports = async function (req, res){
    //Get query params:
    const { domain, role } = req.body;

    //Get user ID to the payload:
    const user_id = req.decoded.sub;

    //Create MongoDB arguments:
    const usersFilter = { _id: user_id };
    const usersProj = { status: 1, permissions: 1, settings: 1 };

    //Build query:
    await users.Model.findOne(usersFilter, usersProj)
    .exec()
    .then(async (userData) => {
        //Convert Mongoose object to Javascript object:
        userData = userData.toObject();

        //Check user status:
        if(userData.status == true){

            //Initialize permisionChecked
            let permisionChecked = false;

            //Initialize user permission:
            let userPermission = {
                domain: '', 
                role: '',
                consession: []
            };

            //Obtain permissions keys (await foreach):
            await Promise.all(userData.permissions.map(async (value, key) => {
                //Check that the user really has the indicated domain:
                if ((Object.keys(value).includes('organization') && value['organization'] == domain) || 
                    (Object.keys(value).includes('branch') && value['branch'] == domain) || 
                    (Object.keys(value).includes('service') && value['service'] == domain)){
                    
                    //Check that the user really has the indicated role in the specific domain:
                    if(value['role'] == role){
                        permisionChecked = true;

                        //Set userPermission:
                        userPermission.domain = mongoose.Types.ObjectId(domain);
                        userPermission.role = parseInt(role);
                        userPermission.consession = value['concession'];
                    }
                }
            }));
            
            //If contain the specific permission:
            if(permisionChecked){
                //Set creation date:
                const creation_date = Date.now();

                //Create session object:
                const sessionObj = {
                    start: creation_date,                           //Same as payload iat
                    fk_user: mongoose.Types.ObjectId(userData._id), //Cast to ObjectId
                    current_access: userPermission
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
                        fk_user: mongoose.Types.ObjectId(userData._id),
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
                            sub: userData._id.toString(),       //Identify the subject of the token.
                            iat: (creation_date / 1000),        //Token creation date.
                            //exp: (Declared in expiresIn)      //Token expiration date.
                            session: userPermission             //User permission for the session.
                        }

                        //Create JWT (Temp):
                        jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: time_exp }, async (err, token) => {
                            if(err){
                                res.status(500).send({ success: false, message: currentLang.jwt.sign_error, error: err });
                                return;
                            } else {
                                //Send successfully response:
                                res.status(200).send({ success: true, message: currentLang.auth.singin_success, token: token });
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

            } else {
                res.status(200).send({ success: false, message: currentLang.auth.wrong_role_domain });
            }

        } else {
            res.status(200).send({ success: false, message: currentLang.auth.user_disabled });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//