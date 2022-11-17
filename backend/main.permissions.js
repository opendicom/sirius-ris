//--------------------------------------------------------------------------------------------------------------------//
// MAIN PERMISSIONS - RABC RULES:
// This module establishes the rules that will be applied in the RABC middleware.
//--------------------------------------------------------------------------------------------------------------------//
//Set user role permissions:
const rolePermissions = {
    //Superusuario:
    1: {
        people                  : ['find', 'findOne', 'insert', 'update', 'delete'],
        users                   : ['find', 'findOne', 'insert', 'update', 'delete'],            
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
        mwl                     : ['insert']
    },

    //Administrador:
    2: {
        people                  : ['find', 'findOne', 'insert', 'update'],
        users                   : ['find', 'findOne', 'insert', 'update'],
        logs                    : ['find', 'findOne'],
        modalities              : ['find', 'findOne'],
        organizations           : ['find', 'findOne'],
        branches                : ['find', 'findOne'],
        services                : ['find', 'findOne', 'insert', 'update'],
        equipments              : ['find', 'findOne'],
        slots                   : ['find', 'findOne', 'insert', 'update', 'batch/insert', 'batch/delete'],
        procedures              : ['find', 'findOne', 'insert', 'update'],
        procedure_categories    : ['find', 'findOne', 'insert', 'update', 'batch/delete'],
        files                   : ['find', 'findOne', 'insert', 'delete', 'batch/delete'],
        appointments            : ['find', 'findOne', 'insert', 'update'],
        appointments_drafts     : ['find', 'findOne', 'insert', 'delete'],
        mwl                     : ['insert']
    },

    //Médico:
    4: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne'],
        logs                    : ['find', 'findOne'],
        modalities              : ['find', 'findOne'],
        organizations           : ['find', 'findOne'],
        branches                : ['find', 'findOne'],
        services                : ['find', 'findOne'],
        equipments              : ['find', 'findOne'],
        slots                   : ['find', 'findOne'],
        procedures              : ['find', 'findOne'],
        procedure_categories    : ['find', 'findOne'],
        appointments            : ['find', 'findOne']
    },

    //Coordinador:
    7: {
        people                  : ['find', 'findOne'],
        users                   : ['find', 'findOne'],
        logs                    : ['find', 'findOne'],
        modalities              : ['find', 'findOne'],
        organizations           : ['find', 'findOne'],
        branches                : ['find', 'findOne'],
        services                : ['find', 'findOne'],
        equipments              : ['find', 'findOne'],
        slots                   : ['find', 'findOne', 'insert', 'update', 'batch/insert', 'batch/delete'],
        procedures              : ['find', 'findOne'],
        procedure_categories    : ['find', 'findOne'],
        files                   : ['find', 'findOne', 'insert', 'delete', 'batch/delete'],
        appointments            : ['find', 'findOne', 'insert', 'update'],
        appointments_drafts     : ['find', 'findOne', 'insert', 'delete'],
    },

    //Recepcionista:
    8: {
        people                  : ['find', 'findOne', 'insert', 'update'],
        users                   : ['find', 'findOne', 'insert', 'update'],
        logs                    : ['find', 'findOne'],
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
        appointments_drafts     : ['find', 'findOne'],
        mwl                     : ['insert']
    },

    //Paciente:
    9: {
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
    }
}

//Set user concessions:
const concessionPermissions = {
    // 1 : Gestión de turnos:
    1: {
        slots : ['find', 'findOne', 'insert', 'update', 'batch/insert', 'batch/delete']
    },

    // 2 : Gestión de citas:
    2: {
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
        mwl                     : ['insert'],
        studies                 : ['find', 'findOne', 'insert', 'update']
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