//--------------------------------------------------------------------------------------------------------------------//
// MAIN PERMISSIONS - RABC RULES:
// This module establishes the rules that will be applied in the RABC middleware.
//--------------------------------------------------------------------------------------------------------------------//
//Set user role permissions:
const rolePermissions = {
    // Superusuario:
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
        mail                    : ['send'],
        exporter                : ['reports'],
        wezen                   : ['studyToken'],
        proxy                   : ['wado']
    },

    // Administrador:
    2: {
        people                  : ['find', 'findOne', 'insert', 'update'],
        users                   : ['find', 'findOne', 'findByService', 'insert', 'update'],
        logs                    : ['find', 'findOne'],
        sessions                : ['find', 'findOne'],
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
        mail                    : ['send'],
        exporter                : [],
        wezen                   : ['studyToken'],
        proxy                   : ['wado']
    },

    // Supervisor:
    3: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne', 'findByService'],
        logs                    : [],
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
        appointments            : ['find', 'findOne'],
        appointments_drafts     : [],
        mwl                     : [],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne'],
        reports                 : ['find', 'findOne', 'insert', 'update', 'authenticate', 'setPathologies'],
        signatures              : ['find', 'findOne', 'insert'],
        mail                    : [],
        exporter                : [],
        wezen                   : ['studyToken'],
        proxy                   : ['wado']
    },

    // Médico:
    4: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne', 'findByService'],
        logs                    : [],
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
        appointments            : ['find', 'findOne'],
        appointments_drafts     : [],
        mwl                     : [],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne'],
        reports                 : ['find', 'findOne', 'insert', 'update', 'setPathologies'],
        signatures              : ['find', 'findOne'],
        mail                    : [],
        exporter                : [],
        wezen                   : ['studyToken'],
        proxy                   : ['wado']
    },

    // Técnico:
    5: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne', 'findByService'],
        logs                    : [],
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
        performing              : ['find', 'findOne', 'update'],
        reports                 : [],
        signatures              : [],
        mail                    : [],
        exporter                : [],
        wezen                   : ['studyToken'],
        proxy                   : ['wado']
    },

    // Enfermero:
    6: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne', 'findByService'],
        logs                    : [],
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
        mwl                     : [],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne', 'update'],
        reports                 : [],
        signatures              : [],
        mail                    : [],
        exporter                : [],
        wezen                   : ['studyToken'],
        proxy                   : ['wado']
    },

    // Coordinador:
    7: {
        people                  : ['find', 'findOne', 'insert', 'update'],
        users                   : ['find', 'findOne', 'findByService', 'insert', 'update'],
        logs                    : [],
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
        mail                    : ['send'],
        exporter                : [],
        wezen                   : [],
        proxy                   : []
    },

    // Recepcionista:
    8: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne', 'findByService'],
        logs                    : [],
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
        mail                    : [],
        exporter                : [],
        wezen                   : [],
        proxy                   : []
    },

    // Paciente:
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
        mail                    : [],
        exporter                : [],
        wezen                   : ['studyToken'],
        proxy                   : ['wado']
    },

    // Funcional [Empty role for concessions (Generic user)]:
    10: {
        people                  : [],
        users                   : [],            
        logs                    : [],
        sessions                : [],
        modalities              : [],
        organizations           : [],
        branches                : [],
        services                : [],
        equipments              : [],
        slots                   : [],
        procedures              : [],
        procedure_categories    : [],
        files                   : [],
        appointments            : [],
        appointments_drafts     : [],
        mwl                     : [],
        pathologies             : [],
        performing              : [],
        reports                 : [],
        signatures              : [],
        mail                    : [],
        exporter                : [],
        wezen                   : [],
        proxy                   : []
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
        appointments_drafts     : ['find', 'findOne', 'insert', 'delete'],
        mail                    : ['send']
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
        mwl                     : ['insert'],
        performing              : ['find', 'findOne', 'insert', 'update']
    },

    // 5 : Gestión de estudios:
    5: {
        users                   : ['find', 'findOne', 'findByService'],
        files                   : ['find', 'findOne', 'insert', 'delete', 'batch/delete'],
        appointments            : ['find', 'findOne', 'update'],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne', 'insert', 'update'],
        reports                 : ['find', 'findOne'],
        signatures              : ['find', 'findOne']
    },

    // 6 : Gestión de informes:
    6: {
        users                   : ['find', 'findOne', 'findByService'],
        files                   : ['find', 'findOne', 'insert', 'delete', 'batch/delete'],
        appointments            : ['find', 'findOne'],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne'],
        reports                 : ['find', 'findOne', 'insert', 'update', 'setPathologies'],
        signatures              : ['find', 'findOne']
    },

    // 7 : Firmar informes:
    7: {
        users                   : ['find', 'findOne', 'findByService'],
        appointments            : ['find', 'findOne'],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne'],
        reports                 : ['find', 'findOne'],
        signatures              : ['find', 'findOne', 'insert']
    },

    // 8 : Autenticar informes:
    8: {
        users                   : ['find', 'findOne', 'findByService'],
        appointments            : ['find', 'findOne'],
        pathologies             : ['find', 'findOne'],
        performing              : ['find', 'findOne'],
        reports                 : ['find', 'findOne', 'authenticate'],
        signatures              : ['find', 'findOne']
    },

    // 9 : Enmendar informes:
    // This concession depends on being a Supervisor, Médico or higher user or having the '6' concession [Gestión de informes].
    9: {
        reports                 : ['insert']
    },

    // 10 : Acceso a logs del usuario (Frontend concession):
    10: {
        logs                    : ['find', 'findOne']
    },

    // 11 : Acceso a logs de elementos (Frontend concession):
    11: {
        logs                    : ['find', 'findOne']
    },

    // 12 : Reenvío de correos:
    12: {
        mail                    : ['send']
    },

    // 13 : Búsquedas avanzadas:
    // 14 : Listados de facturación:
    // 15 : Estadísticas generales:
    // 16 : Estadísticas médicas:
    // 17 : Estadísticas del personal:
    // 18 : Eliminación física de archivos:
    // 19 : Supervisar citas en curso:
    // XX : Listado de procedimientos (Readonly -> appointment_requests):

    // 20 : Acceso al módulo de exportación (Backend access only):
    20: {
        exporter                : ['reports']
    },

    // 21 : Acceso al servicio de imágenes del PACS.
    21: {
        wezen                   : ['studyToken'],
        proxy                   : ['wado']
    }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
//Export permissions:
module.exports = {
    rolePermissions,
    concessionPermissions
};
//--------------------------------------------------------------------------------------------------------------------//