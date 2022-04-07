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
    const { username, password } = req.body;

    //Create MongoDB arguments:
    const usersFilter = { username: username };
    const usersProj = { status: 1, password: 1, permissions: 1 };

    //Execute query:
    await users.Model.findOne(usersFilter, usersProj)
    .exec()
    .then((userData) => {
        //Check values projected (strictCheck): 
        //mainServices.strictCheck(usersProj, userData);

        //Check user status:
        if(userData.status == true){
            //Check user password:
            mainServices.verifyPass(userData.password, password)
            .then(async (same) => {
                //If Passwords match:
                if(same){
                    //Set creation date:
                    const creation_date = Date.now();

                    //Initialize user permission (Machine has only one permission):
                    let userPermission = {
                        domain: '', 
                        role: '',
                        consession: []
                    };

                    //Set domain:
                    if(userData.permissions[0].organization){
                        userPermission.domain = mongoose.Types.ObjectId(userData.permissions[0].organization);
                    } else if(userData.permissions[0].branch){
                        userPermission.domain = mongoose.Types.ObjectId(userData.permissions[0].branch);
                    } else if(userData.permissions[0].service){
                        userPermission.domain = mongoose.Types.ObjectId(userData.permissions[0].service);
                    }

                    //Set role:
                    userPermission.role = userData.permissions[0].role;

                    //Set consessions:
                    if(userData.permissions[0].consession){
                        userPermission.consession = userData.permissions[0].consession;
                    }
                    
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
                            event: 1,                   //Loggin
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
                                    res.status(200).send({ success: true, payload: payload, token: token });
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
                    //Passwords don't match:
                    res.status(200).send({ success: false, message: 'Contraseña incorrecta.' });
                }
            })
            .catch((err) => {
                res.status(200).send({ success: false, message: 'Error durante la verificación del password, puede que el contenido del hash guardado en la BD no corresponda con el algoritmo de cifrado utilizado.', error: err });
            });
        } else {
            res.status(200).send({ success: false, message: 'La cuenta de usuario ingresada está inhabilitada.' });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//