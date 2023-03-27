//--------------------------------------------------------------------------------------------------------------------//
// MAIN PERMISSIONS - RABC RULES:
// This module establishes the rules that will be applied in the RABC middleware.
//--------------------------------------------------------------------------------------------------------------------//
//Set user role permissions:
const rolePermissions = {
    //Superusuario:
    1: {
        people                  : ['find', 'findOne', 'insert', 'update', 'delete'],
        users                   : ['find', 'findOne', 'findByService', 'insert', 'update', 'delete'],            
        logs                    : ['find', 'findOne'],
        sessions                : ['find', 'findOne', 'delete'],
        modalities              : ['find', 'findOne', 'insert', 'update', 'delete'],
        organizations           : ['find', 'findOne', 'insert', 'update', 'delete'],
        branches                : ['find', 'findOne', 'insert', 'update', 'delete'],
        services                : ['find', 'findOne', 'insert', 'update', 'delete'],
        equipments              : ['find', 'findOne', 'insert', 'update', 'delete'],
        slots                   : ['find', 'findOne', 'insert', 'update', 'delete', 'batch/insert', 'batch/delete'],
        procedures              : ['find', 'findOne', 'insert', 'update', 'delete'],
        procedure_categories    : ['find', 'findOne', 'insert', 'update', 'delete', 'batch/delete'],
        files                   : ['find', 'findOne', 'insert', 'delete', 'batch/delete'],
        appointments            : ['find', 'findOne', 'insert', 'update', 'delete'],
        appointments_drafts     : ['find', 'findOne', 'insert', 'delete'],
        mwl                     : ['insert'],
        pathologies             : ['find', 'findOne', 'insert', 'update', 'delete'],
        performing              : ['find', 'findOne', 'insert', 'update', 'delete'],
        reports                 : ['find', 'findOne', 'insert', 'update', 'delete', 'authenticate', 'setPathologies'],
        signatures              : ['find', 'findOne', 'insert', 'delete'],
    },

    //Administrador:
    2: {
        people                  : ['find', 'findOne', 'insert', 'update'],
        users                   : ['find', 'findOne', 'findByService', 'insert', 'update'],
        logs                    : ['find', 'findOne'],
        sessions                : [],
        modalities              : ['find', 'findOne'],
        organizations           : ['find', 'findOne'],
        branches                : ['find', 'findOne'],
        services                : ['find', 'findOne', 'insert', 'update'],
        equipments              : ['find', 'findOne'],
        slots                   : ['find', 'findOne', 'insert', 'update', 'delete', 'batch/insert', 'batch/delete'],
        procedures              : ['find', 'findOne', 'insert', 'update', 'delete'],
        procedure_categories    : ['find', 'findOne', 'insert', 'update', 'delete', 'batch/delete'],
        files                   : ['find', 'findOne', 'insert', 'delete', 'batch/delete'],
        appointments            : ['find', 'findOne', 'insert', 'update'],
        appointments_drafts     : ['find', 'findOne', 'insert', 'delete'],
        mwl                     : ['insert'],
        pathologies             : ['find', 'findOne', 'insert', 'update'],
        performing              : ['find', 'findOne', 'insert', 'update'],
        reports                 : ['find', 'findOne', 'insert', 'update', 'setPathologies'],
        signatures              : ['find', 'findOne'],
    },

    //Médico:
    4: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne'],
        logs                    : ['find', 'findOne'],
        sessions                : [],
        modalities              : ['find', 'findOne'],
        organizations           : ['find', 'findOne'],
        branches                : ['find', 'findOne'],
        services                : ['find', 'findOne'],
        equipments              : ['find', 'findOne'],
        slots                   : ['find', 'findOne'],
        procedures              : ['find', 'findOne'],
        procedure_categories    : ['find', 'findOne'],
        files                   : ['find', 'findOne'],
        appointments            : ['find', 'findOne'],
        appointments_drafts     : [],
        mwl                     : [],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne'],
        reports                 : ['find', 'findOne', 'insert', 'update', 'setPathologies'],
        signatures              : ['find', 'findOne', 'insert'],
    },

    //Coordinador:
    7: {
        people                  : ['find', 'findOne', 'insert', 'update'],
        users                   : ['find', 'findOne', 'insert', 'update'],
        logs                    : ['find', 'findOne'],
        sessions                : [],
        modalities              : ['find', 'findOne'],
        organizations           : ['find', 'findOne'],
        branches                : ['find', 'findOne'],
        services                : ['find', 'findOne'],
        equipments              : ['find', 'findOne'],
        slots                   : ['find', 'findOne', 'insert', 'update', 'delete', 'batch/insert', 'batch/delete'],
        procedures              : ['find', 'findOne'],
        procedure_categories    : ['find', 'findOne'],
        files                   : ['find', 'findOne', 'insert', 'delete', 'batch/delete'],
        appointments            : ['find', 'findOne', 'insert', 'update'],
        appointments_drafts     : ['find', 'findOne', 'insert', 'delete'],
        mwl                     : [],
        pathologies             : ['find', 'findOne'],
        performing              : [],
        reports                 : [],
        signatures              : [],
    },

    //Recepcionista:
    8: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne', 'findByService'],
        logs                    : ['find', 'findOne'],
        sessions                : [],
        modalities              : ['find', 'findOne'],
        organizations           : ['find', 'findOne'],
        branches                : ['find', 'findOne'],
        services                : ['find', 'findOne'],
        equipments              : ['find', 'findOne'],
        slots                   : ['find', 'findOne'],
        procedures              : ['find', 'findOne'],
        procedure_categories    : ['find', 'findOne'],
        files                   : ['find', 'findOne', 'insert', 'delete', 'batch/delete'],
        appointments            : ['find', 'findOne', 'update'],
        appointments_drafts     : [],
        mwl                     : ['insert'],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne', 'insert', 'update'],
        reports                 : [],
        signatures              : [],
    },

    //Paciente:
    9: {
        people                  : [],
        users                   : [],
        logs                    : [],
        modalities              : ['find', 'findOne'],
        organizations           : ['find', 'findOne'],
        branches                : ['find', 'findOne'],
        services                : ['find', 'findOne'],
        equipments              : ['find', 'findOne'],
        slots                   : ['find', 'findOne'],
        procedures              : ['find', 'findOne'],
        procedure_categories    : ['find', 'findOne'],
        files                   : [],
        appointments            : ['find', 'findOne'],
        appointments_drafts     : [],
        mwl                     : [],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne'],
        reports                 : ['find', 'findOne'],
        signatures              : ['find', 'findOne'],
    }
}

//Set user concessions:
const concessionPermissions = {
    // 1 : Gestión de turnos:
    1: {
        slots                   : ['find', 'findOne', 'insert', 'update', 'delete', 'batch/insert', 'batch/delete'],
    },

    // 2 : Gestión de citas:
    2: {
        people                  : ['find', 'findOne', 'insert', 'update'],
        users                   : ['find', 'findOne', 'findByService', 'insert', 'update'],
        slots                   : ['find', 'findOne'],
        appointments            : ['find', 'findOne', 'insert', 'update'],
        appointments_drafts     : ['find', 'findOne', 'insert', 'delete']
    },

    // 3 : Calendario de citas:
    3: {
        slots                   : ['find', 'findOne'],
        appointments            : ['find', 'findOne'],
        appointments_drafts     : ['find', 'findOne']
    },

    // 4 : Gestión de recepciones:
    4: {
        appointments            : ['find', 'findOne'],
        mwl                     : ['insert']
    }

    // 5 : Gestión de estudios:
    // 6 : Gestión de informes:
    // 7 : Firmar informes:
    // 8 : Autenticar informes:
    // 9 : Búsquedas avanzadas:
    // 10 : Listados de facturación:
    // 11 : Estadísticas generales:
    // 12 : Estadísticas médicas:
    // 13 : Estadísticas del personal:
    // 15 : Eliminación física de archivos:
    // 16 : Supervisar citas en curso:
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
//Export permissions:
module.exports = {
    rolePermissions,
    concessionPermissions
};
//--------------------------------------------------------------------------------------------------------------------//