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
    const usersProj = { fk_people: 1, permissions: 1, settings: 1 };

    //Build query:
    const usersQuery = users.Model.findOne(usersFilter, usersProj);

    //Execute query:
    await mainServices.queryMongoDB(usersQuery, res, async (userData) => {
        //Check that the user really has the indicated permission:
        console.log(userData);

        //Create user session:
    });

    // Se recibe request del usuario con Token de Autorización y el uno de los permisos disponibles del usuario.
    // El sistema valida si existe el permiso enviado para dicho usuario, si es correcto, el sistema envía un Response con un JWT de Session.
    // Sino, se envía un Response con un mensaje de error.

    res.status(200).send({ success: true, message: currentLang.jwt.sign_success });
}
//--------------------------------------------------------------------------------------------------------------------//