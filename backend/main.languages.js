//--------------------------------------------------------------------------------------------------------------------//
// LANGUAGE MODULE:
// This module establishing the response messages for each language.
//--------------------------------------------------------------------------------------------------------------------//
module.exports = function(language){
    
    //Initialize translate object (English - Default):
    const lang = {
        'server': {
            'db_cnx_error'          : 'Failed to establish connection with MongoDB to: ',
            'db_cnx_success'        : 'Established connection with MongoDB to: ',
            'start'                 : 'Sirius RIS Backend has started',
            'non_server'            : 'The server type was not specified in the settings file (http_enabled, https_enabled). ',
            'undefined_settings'    : 'An error occurred while trying to read the settings.yaml file.'
        },
        'auth': {
            'password_match'        : 'Passwords match.',
            'password_dont_match'   : 'Passwords dont match.',
            'password_empty'        : 'Password field cannot be empty.',
            'password_error'        : 'Error during password verification, it may be that the content of the hash saved in the database does not correspond to the encryption algorithm used.',
            'signin_success'        : 'Successful authentication.',
            'user_disabled'         : 'The user account entered is disabled.',
            'wrong_user'            : 'The entered user is NOT found in the database.',
            'wrong_role_domain'     : 'The indicated domain and/or role are not assigned to the user.'
        },
        'jwt': {
            'sign_error'            : 'An error occurred during the JWT generation.',
            'check_empty_token'     : 'The authentication token is required.',
            'check_invalid_token'   : 'Invalid token.'
        },
        'db': {
            'invalid_id'            : 'The specified ID is NOT valid for MongoDB.',
            'query_error'           : 'Error during query to MongoDB.',
            'query_no_data'         : 'No records was found.',
            'validate_error'        : 'Validation error.',
            'insert_success'        : 'Insert operation successful.',
            'insert_error'          : 'An error occurred while inserting the element.',
            'insert_duplicate'      : 'The element you are trying to insert already exists in the database with the _id: ',
            'id_no_results'         : 'The specified ID does not exist.',
            'id_referenced_empty'   : 'The ID of the referenced element cannot be empty.',
            'update_error'          : 'An error occurred while updating the element.',
            'update_duplicate'      : 'The element you are trying to update already exists in the database with the _id: ',
            'delete_error'          : 'An error occurred while deleting the element.',
            'delete_success'        : 'Successfully deleted.',
            'delete_id_no_results'  : 'No record was found to delete with the specified ID.',
            'delete_rejected_dep'   : 'Deletion rejected, there are dependencies of the element to be deleted.',
            'delete_empty_id'       : 'You must specify at least one _id for delete.',
            'not_valid_fk'          : 'Any of the elements referenced as foreign is NOT valid',
            'not_valid_objectid'    : 'Some of the referenced elements have an ObjectId that is NOT valid.',
            'not_allowed_save'      : 'Save operation NOT allowed.',
        },
        http: {
            'sancioned'             : 'SANCIONED CLIENTS!',
            'sancioned_msj'         : 'You have made too many signin attempts within the allowed time.',
            'bad_request'           : 'Bad request.',
            'pager_disabled'        : 'Pager is disabled'
        }

    };

    //Set translations according to the requested language: 
    switch (language) {
        case 'ES':
            lang.server.db_cnx_error            = 'Error al intentar establecer la conexión con MongoDB hacia: ';
            lang.server.db_cnx_success          = 'Conexión satisfactoria con MongoDB hacia: ';
            lang.server.start                   = 'Sirius RIS Backend ha iniciado';
            lang.server.non_server              = 'No se estableció ningún tipo de servidor en el archivo de configuración (http_enabled, https_enabled).';
            lang.server.undefined_settings      = 'Se produjo un error al intentar leer el archivo settings.yaml.'

            lang.auth.password_match            = 'Contraseña correcta.';
            lang.auth.password_dont_match       = 'La contraseña NO coincide.';
            lang.auth.password_empty            = 'La contraseña NO puede ser vacía.';
            lang.auth.password_error            = 'Error durante la verificación del password, puede que el contenido del hash guardado en la BD no corresponda con el algoritmo de cifrado utilizado.';
            lang.auth.signin_success            = 'Autenticación exitosa.';
            lang.auth.user_disabled             = 'La cuenta de usuario ingresada está inhabilitada.';
            lang.auth.wrong_user                = 'El usuario ingresado NO se encuentra en la base de datos.';
            lang.auth.wrong_role_domain         = 'El dominio y/o rol indicado no se encuentran adjudicados al usuario.';

            lang.jwt.sign_error                 = 'Ha ocurrido un error durante la generación del JWT.';
            lang.jwt.check_empty_token          = 'Es necesario un token de autenticación.';
            lang.jwt.check_invalid_token        = 'El token no es válido.';

            lang.db.invalid_id                  = 'El ID especificado NO es válido para MongoDB.';
            lang.db.query_error                 = 'Error durante la consulta al servidor MongoDB.';
            lang.db.query_no_data               = 'No se encontraron registros.';
            lang.db.validate_error              = 'Error de validación.';
            lang.db.insert_success              = 'Guardado exitoso.';
            lang.db.insert_error                = 'Error al intentar insertar el elemento.';
            lang.db.insert_duplicate            = 'El elemento que esta intentando insertar ya existe en la base de datos bajo el _id: ';
            lang.db.id_no_results               = 'No existe ningún elemento con el ID especificado';
            lang.db.id_referenced_empty         = 'El ID del elemento referenciado no puede ser vacío.';
            lang.db.update_error                = 'Error al intentar actualizar el elemento.';
            lang.db.update_duplicate            = 'El elemento que esta actualizar actualizar ya existe en la base de datos bajo el _id: ';
            lang.db.delete_error                = 'Error al intentar eliminar el elemento.';
            lang.db.delete_success              = 'Eliminación exitosa.';
            lang.db.delete_id_no_results        = 'No se encuentra ningún registro para eliminar con el ID especificado.';
            lang.db.delete_rejected_dep         = 'Eliminación rechazada, existen dependencias del elemento que se desea eliminar.';
            lang.db.delete_empty_id             = 'Debe especificar al menos un _id para la eliminación.';
            lang.db.not_valid_fk                = 'Alguno de los elementos referenciados como foráneos NO es válido.';
            lang.db.not_valid_objectid          = 'Alguno de los elementos referenciados posee un ObjectId que NO es válido.';
            lang.db.not_allowed_save            = 'Operación de guardado NO permitida.';
            
            lang.http.sancioned                 = '¡CLIENTES SANCIONADOS!';
            lang.http.sancioned_msj             = 'Ha realizado demasiados intentos de signin dentro del tiempo permitido.';
            lang.http.bad_request               = 'La solicitud enviada es incorrecta.';
            lang.http.pager_disabled            = 'Paginación desactivada.'

            break;
    }

    //Return translate object:
    return lang;
}
//--------------------------------------------------------------------------------------------------------------------//