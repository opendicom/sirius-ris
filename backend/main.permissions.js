//--------------------------------------------------------------------------------------------------------------------//
// MAIN PERMISSIONS - RABC RULES:
// This module establishes the rules that will be applied in the RABC middleware.
//--------------------------------------------------------------------------------------------------------------------//
//Set user role permissions:
const rolePermissions = {
    //Superuser:
    1: {
        users           : ['find', 'findOne', 'insert', 'update', 'delete'],            
        logs            : ['find', 'findOne'],
        sessions        : ['find', 'findOne', 'delete'],
        modalities      : ['find', 'findOne', 'insert', 'update', 'delete'],
        organizations   : ['find', 'findOne', 'insert', 'update', 'delete'],
        branches        : ['find', 'findOne', 'insert', 'update', 'delete'],
        services        : ['find', 'findOne', 'insert', 'update', 'delete'],
        equipments      : ['find', 'findOne', 'insert', 'update', 'delete'],
        slots           : ['find', 'findOne', 'insert', 'update', 'delete'],

    },

    //Administrator:
    2: {
        users           : ['find', 'findOne', 'insert', 'update'],
        logs            : ['find', 'findOne'],
        modalities      : ['find', 'findOne'],
        organizations   : ['find', 'findOne'],
        branches        : ['find', 'findOne', 'insert', 'update'],
        services        : ['find', 'findOne', 'insert', 'update'],
        equipments      : ['find', 'findOne', 'insert', 'update'],
        slots           : ['find', 'findOne', 'insert', 'update'], //delete
    }
}

//Set user consessions:
const consessionPermissions = {
    //Sign report
    1: { report: ['sign'] },

    //Authenticate report:
    2: { report: ['authenticate'] },

    //Test:
    3: { test: ['find', 'update'] }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
//Export permissions:
module.exports = {
    rolePermissions,
    consessionPermissions
};
//--------------------------------------------------------------------------------------------------------------------//