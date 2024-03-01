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
            'invalid_id'                : 'The specified ID is NOT valid for MongoDB.',
            'query_error'               : 'Error during query to MongoDB.',
            'query_no_data'             : 'No records was found.',
            'validate_error'            : 'Validation error.',
            'insert_success'            : 'Insert operation successful.',
            'insert_error'              : 'An error occurred while inserting the element.',
            'insert_error_log'          : 'Error trying to insert element log entry.',
            'insert_duplicate'          : 'The element you are trying to insert already exists in the database with the _id: ',
            'id_no_results'             : 'The specified ID does not exist.',
            'id_referenced_empty'       : 'The ID of the referenced element cannot be empty.',
            'update_error'              : 'An error occurred while updating the element.',
            'update_duplicate'          : 'The element you are trying to update already exists in the database with the _id: ',
            'delete_error'              : 'An error occurred while deleting the element.',
            'delete_success'            : 'Successfully deleted.',
            'delete_id_no_results'      : 'No record was found to delete with the specified ID.',
            'delete_rejected_dep'       : 'Deletion rejected, there are dependencies of the element to be deleted.',
            'delete_empty_id'           : 'You must specify at least one _id for delete.',
            'not_valid_fk'              : 'Any of the elements referenced as foreign is NOT valid',
            'not_valid_objectid'        : 'Some of the referenced elements have an ObjectId that is NOT valid.',
            'not_allowed_save'          : 'Save operation NOT allowed.',
            'delete_temp_file_uploads'  : 'Successful temporary file deletion (upload files).'
        },
        http: {
            'sancioned'             : 'SANCIONED CLIENTS!',
            'sancioned_msj'         : 'You have made too many signin attempts within the allowed time.',
            'bad_request'           : 'Bad request.',
            'pager_disabled'        : 'Pager is disabled'
        },
        rabc: {
            'operation_deny_domain'         : 'The operation you are trying to perform is not allowed for the domain that owns your authentication.',
            'not_have_method_permissions'   : 'The user does not have the necessary permissions on the method: ',
            'not_have_schema_permissions'   : 'The user does not have the necessary permissions on the schema: ',
            'exclude_code'                  : 'Domain condition was avoided from RABC by exclusion policy (rabc_exclude_code was applied)'
        },
        ris: {
            'operation_not_allowed'         : 'Operation NOT allowed, the domain indicated from the JWT does NOT allow the desired operation.',
            'empty_domain_JWT'              : 'To check for a domain reference, the filter parameter can NOT be empty.',
            'duplicated_person'             : 'The person you are trying to insert already exists in the database.',
            'same_document'                 : 'Unable to update entered information. There is already another person with the same document in the database.',
            'unavailable_slot'              : 'The indicated start and/or end is not available in the slot. Used by the appointment _id: ',
            'wrong_date_format_slot'        : 'The format of the start and/or end datetime is wrong.',
            'batch_processed'               : 'Batch processed successfully.',
            'only_urgency_slot'             : 'The appointment cannot be coordinated on an urgency slot unless it is an urgencies.',
            'study_iuid_error'              : 'There was some problem trying to generate the Study IUID: ',
            'mwl_success'                   : 'Submitted to MWL successfully.',
            'mwl_error'                     : 'An error occurred while sending an element to the MWL (MLLP).',
            'wrong_performing_flow_state'   : 'The performing of the study is not in a flow state to be informed.',
            'wrong_report_flow_state'       : 'The performing of the study is not in a flow state to be signed.',
            'wrong_report_id'               : 'No report found with the specified _id.',
            'report_auth_error'             : 'The performing of the study is not in a flow state to be authenticate.',
            'report_auth_success'           : 'Report authenticated successfully.',
            'report_without_signatures'     : 'The report you want to authenticate is not signed.',
            'report_signed'                 : 'The report you are trying to sign is already signed by the indicated user.',
            'report_create_error'           : 'An error occurred during the creation of the PDF report.',
            'report_authenticated'          : 'Report successfully authenticated.',
            'mail_send_success'             : 'Mail sent successfully.',
            'mail_send_error'               : 'Error trying to send mail.',
            'mail_wrong_address'            : 'The email address indicated is incorrect.',
            'mail_empty_subject'            : 'The subject parameter cannot be empty.',
            'mail_empty_message'            : 'The message cannot be empty.',
            'mail_wrong_file'               : 'The specified filename or base64 is wrong.',
            'missing_information_log'       : 'Missing information for log record.',
            'procedure_not_found'           : 'Procedure not found with the specified _id.',
            'modalitiy_not_found'           : 'Modalitiy not found with the specified code value.',
            'flow_state_error'              : 'Error updating request flow state.',
            'validate' : {
                'delete_code_required'      : 'To remove an item you must specify the valid delete code.',
                'same_dates'                : 'The start date and the end date must be the same.',
                'start_date_lte_end_date'   : 'The start date must be less than the end date.',
                'start_time_lte_end_time'   : 'The start time must be less than the end time.',
                'weekday_boolean'           : 'The day of the week must be boolean [true, false].',
                'weekday_required'          : 'At least one day of the week must be true to apply the date range.',
                'time_format'               : 'The start or end time format is incorrect [Supported format: HH:MM (24h)].',
                'urgency_boolean'           : 'The urgency parameter must be boolean [true, false].',
                'valid_permission'          : 'You must enter at least one valid permission to the user.',
                'fk_slot_required'          : 'The fk_slot parameter must be specified (it is required for the operation).',
                'pet_coef_required'         : 'PET-CT procedures require coefficient for the calculation of the dose.',
                'pet_coef_NaN'              : 'The coefficient entered must be numeric.',
                'service_invalid_ObjectId'  : 'The service parameter is not a valid ObjectId.',
                'role_NaN'                  : 'The role parameter is NOT a numeric value or is NOT within the valid role numbers.',
                'invalid_role_in_report'    : 'The role_in_report parameter only allows the following values: [ sign | authenticator ].'
            }
        }

    };

    //Set translations according to the requested language: 
    switch (language) {
        case 'ES':
            //Server:
            lang.server.db_cnx_error            = 'Error al intentar establecer la conexión con MongoDB hacia: ';
            lang.server.db_cnx_success          = 'Conexión satisfactoria con MongoDB hacia: ';
            lang.server.start                   = 'Sirius RIS Backend ha iniciado';
            lang.server.non_server              = 'No se estableció ningún tipo de servidor en el archivo de configuración (http_enabled, https_enabled).';
            lang.server.undefined_settings      = 'Se produjo un error al intentar leer el archivo settings.yaml.'

            //Auth:
            lang.auth.password_match            = 'Contraseña correcta.';
            lang.auth.password_dont_match       = 'La contraseña NO coincide.';
            lang.auth.password_empty            = 'La contraseña NO puede ser vacía.';
            lang.auth.password_error            = 'Error durante la verificación del password, puede que el contenido del hash guardado en la BD no corresponda con el algoritmo de cifrado utilizado.';
            lang.auth.signin_success            = 'Autenticación exitosa.';
            lang.auth.user_disabled             = 'La cuenta de usuario ingresada está inhabilitada.';
            lang.auth.wrong_user                = 'El usuario ingresado NO se encuentra en la base de datos.';
            lang.auth.wrong_role_domain         = 'El dominio y/o rol indicado no se encuentran adjudicados al usuario.';

            //JWT:
            lang.jwt.sign_error                 = 'Ha ocurrido un error durante la generación del JWT.';
            lang.jwt.check_empty_token          = 'Es necesario un token de autenticación.';
            lang.jwt.check_invalid_token        = 'El token no es válido.';

            //Database:
            lang.db.invalid_id                  = 'El ID especificado NO es válido para MongoDB.';
            lang.db.query_error                 = 'Error durante la consulta al servidor MongoDB.';
            lang.db.query_no_data               = 'No se encontraron registros.';
            lang.db.validate_error              = 'Error de validación.';
            lang.db.insert_success              = 'Guardado exitoso.';
            lang.db.insert_error                = 'Error al intentar insertar el elemento.';
            lang.db.insert_error_log            = 'Error al intentar insertar entrada de log del elemento.';
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
            lang.db.delete_temp_file_uploads    = 'Eliminación de archivo temporal exitosa (upload files).'
            
            //HTTP:
            lang.http.sancioned                 = '¡CLIENTES SANCIONADOS!';
            lang.http.sancioned_msj             = 'Ha realizado demasiados intentos de signin dentro del tiempo permitido.';
            lang.http.bad_request               = 'La solicitud enviada es incorrecta.';
            lang.http.pager_disabled            = 'Paginación desactivada.'

            //RABC:
            lang.rabc.operation_deny_domain         = 'La operación que está intentando realizar no está permitida para el dominio que posee su autenticación.';
            lang.rabc.not_have_method_permissions   = 'El usuario no posee los permisos necesarios sobre el método: ';
            lang.rabc.not_have_schema_permissions   = 'El usuario no posee los permisos necesarios sobre el esquema: ';
            lang.rabc.exclude_code                  = 'La condicion de dominio fué evitada del RABC por politica de exclusión (se aplicó rabc_exclude_code).';

            //RIS:
            lang.ris.operation_not_allowed          = 'Operación NO permitida, el dominio indicado desde el JWT NO permite la operación deseada.';
            lang.ris.empty_domain_JWT               = 'Para chequear una referencia de dominio, el parametro filter NO puede ser vacío.';
            lang.ris.duplicated_person              = 'La persona que está intentando ingresar ya existe en la base de datos.';
            lang.ris.same_document                  = 'No se puede actualizar la información ingresada. Ya existe otra persona con el mismo documento en la base de datos.';
            lang.ris.unavailable_slot               = 'El inicio y/o fin indicado no se encuentra disponible en el turno. Utilizado por la cita _id: ';
            lang.ris.wrong_date_format_slot         = 'El formato de la fecha de inicio y/o fin NO es correcto.';
            lang.ris.batch_processed                = 'Lote procesado correctamente.';
            lang.ris.only_urgency_slot              = 'No se puede coordinar la cita sobre un turno de urgencias a menos que la misma sea una urgencia.';
            lang.ris.study_iuid_error               = 'Hubo algún problema al intentar generar el Study IUID: ';
            lang.ris.mwl_success                    = 'Enviado a la MWL de forma exitosa.'
            lang.ris.mwl_error                      = 'Ha ocurrido un error al envíar un elemento a la MWL (MLLP).';
            lang.ris.wrong_performing_flow_state    = 'La realización del estudio no se encuentra en estado para poder ser informada.';
            lang.ris.wrong_report_flow_state        = 'La realización del estudio no se encuentra en estado para poder ser firmada.';
            lang.ris.wrong_report_id                = 'No se encontró ningún informe con el _id especificado.';
            lang.ris.report_auth_error              = 'La realización del estudio no se encuentra en estado para poder ser autenticada.';
            lang.ris.report_auth_success            = 'Informe autenticado existosamente.';
            lang.ris.report_without_signatures      = 'El informe que desea autenitcar no se encuentra firmado.';
            lang.ris.report_signed                  = 'El informe que se está intentando firmar ya se encuentra firmado por el usuario indicado.';
            lang.ris.report_create_error            = 'Ha ocurrido un error durante la creación del informe PDF.';
            lang.ris.report_authenticated           = 'Informe autenticado existosamente.';
            lang.ris.mail_send_success              = 'Correo enviado exitosamente.';
            lang.ris.mail_send_error                = 'Error al intentar enviar el correo.';
            lang.ris.mail_wrong_address             = 'La dirección de correo indicada es incorrecta.';
            lang.ris.mail_empty_subject             = 'El parametro subject no puede ser vacío.';
            lang.ris.mail_empty_message             = 'El mensaje no puede ser vacío.';
            lang.ris.mail_wrong_file                = 'El nombre del archivo o el base64 especificado es erroneo.';
            lang.ris.missing_information_log        = 'Falta información para registro de log.'
            lang.ris.procedure_not_found            = 'No se encontró un procedimiento con el _id especificado.';
            lang.ris.modalitiy_not_found            = 'No se encontró una modalidad con el code value especificado.';
            lang.ris.flow_state_error               = 'Error al actualizar estado de flujo de la solicitud.';

            //RIS - Validate:
            lang.ris.validate.delete_code_required      = 'Para eliminar un elemento debe especificar el código de eliminación válido.';
            lang.ris.validate.same_dates                = 'La fecha de inicio y la de fin deben de ser la misma.';
            lang.ris.validate.start_date_lte_end_date   = 'La fecha de inicio debe ser menor que la fecha de fin.';
            lang.ris.validate.start_time_lte_end_time   = 'La hora de inicio debe ser menor que la hora de fin.';
            lang.ris.validate.weekday_boolean           = 'El día de la semana tiene que ser booleano [true, false].';
            lang.ris.validate.weekday_required          = 'Al menos un día de la semana tiene que ser de valor verdadero para aplicar el rango de fechas.';
            lang.ris.validate.time_format               = 'El formato de hora de inicio o fin es incorrecto [Formato admitido: HH:MM (24hs)].';
            lang.ris.validate.urgency_boolean           = 'El parametro urgencia debe ser booleano [true, false].';
            lang.ris.validate.valid_permission          = 'Debe ingresar al menos un permiso válido al usuario.';
            lang.ris.validate.fk_slot_required          = 'El parametro fk_slot debe ser especificado (es requerido para la operación).';
            lang.ris.validate.pet_coef_required         = 'Los procedimientos PET-CT requieren coeficiente para el cálculo de la dosis.';
            lang.ris.validate.pet_coef_NaN              = 'El coeficiente ingresado debe ser numérico.';
            lang.ris.validate.service_invalid_ObjectId  = 'El parámetro service no es un ObjectId válido.';
            lang.ris.validate.role_NaN                  = 'El parámetro role NO es un valor numerico o NO esta comprendido dentro de los numeros de roles válidos.';
            lang.ris.validate.invalid_role_in_report    = 'El parámetro role_in_report solo admite los siguietes valores: [ signer | authenticator ].';

            break;
    }

    //Return translate object:
    return lang;
}
//--------------------------------------------------------------------------------------------------------------------//