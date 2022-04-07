//--------------------------------------------------------------------------------------------------------------------//
// SINGIN HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Import schemas:
const users = require('../../modules/users/schemas');

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
    .then((userData) => {
        //Check user status:
        if(userData.status == true){
            
            console.log(userData);

            //Check that the user really has the indicated permission:

            //Create session in DB:
            
            //Send registry in Log DB:

            //Create JWT Session:

        } else {
            res.status(200).send({ success: false, message: 'La cuenta de usuario ingresada está inhabilitada.' });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    // Se recibe request del usuario con Token de Autorización y el uno de los permisos disponibles del usuario.
    // El sistema valida si existe el permiso enviado para dicho usuario, si es correcto, el sistema envía un Response con un JWT de Session.
    // Sino, se envía un Response con un mensaje de error.

    res.status(200).send({ success: true, message: currentLang.jwt.sign_success });
}
//--------------------------------------------------------------------------------------------------------------------//