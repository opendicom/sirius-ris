//--------------------------------------------------------------------------------------------------------------------//
// MAIN MIDDLEWARES:
//--------------------------------------------------------------------------------------------------------------------//

//Import external modules:
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');

//Import app modules:
const mainServices  = require('./main.services');                           // Main services
const mainSettings = mainServices.getFileSettings();                        // File settings (YAML)
const currentLang = require('./main.languages')(mainSettings.language);     // Language Module

//--------------------------------------------------------------------------------------------------------------------//
//  ALLOWED VALIDATE:
//--------------------------------------------------------------------------------------------------------------------//
// Allowed Validate checks the schema of the current model which elements can be set and which cannot.
// The allowed elements are returned in a set object to be validated.
// The NOT allowed elements are returned to an object called blocked.
//--------------------------------------------------------------------------------------------------------------------//
const allowedValidate = (allowedSchemaKeys) => {
    return (req, res, next) => {
        if(req.body){
            //Initialize attrAllowed and attrNotAllowed objects:
            let attrAllowed = {};
            let attrNotAllowed = {};

            //Initialize validation result object (Inside the Request):
            req.validatedResult = {};
            
            //Loop through elements of the POST request:
            Object.entries(req.body).forEach(([key, value]) => {
                //Check if the element you want to modify exists or not in the current model:
                if(allowedSchemaKeys.includes(key)){
                    //Set allowed parameters:
                    attrAllowed[key] = value;
                } else {
                    //Save parameters NOT allowed:
                    attrNotAllowed[key] = value;
                }
            });

            //Check if there is data to modify:
            if(Object.keys(attrAllowed).length === 0){
                req.validatedResult['set'] = false; //No data to modify. 
            } else {
                req.validatedResult['set'] = attrAllowed; //Assign validated allowed attributes.
            }

            //Check if there are NOT allowed attributes:
            if(Object.keys(attrNotAllowed).length === 0){
                req.validatedResult['blocked'] = false; //No blocked attributes.
            } else {
                req.validatedResult['blocked'] = attrNotAllowed; //Return attributes NOT allowed.
            }
        }
        
        next();
    }
};
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// IS PASSWORD:
// Encrypts the fields designated as passwords in the schema before saving them to the database.
//--------------------------------------------------------------------------------------------------------------------//
const isPassword = (Schema, fieldName = 'password') => {
    //Set amount of repetition of the SALT algorithm:
    const saltRounds = 12;

    //PRE SAVE INSERT:
    Schema.pre('save', function(next){
        //Check if the password field exists according to the name indicated:
        if(!this[fieldName]) return next(); //If password is not updated:
        
        //Hash the password:
        const data = this;
        bcrypt.hash(data[fieldName], saltRounds, (error, hashedPassword) => {
            if(error){
                next(error);
            } else {
                //Save hashed password:
                data[fieldName] = hashedPassword;
                next();
            }
        });
    });
    
    //PRE SAVE UPDATE:
    Schema.pre('findOneAndUpdate', async function(next){
        //Check if the password field exists according to the name indicated:
        if(!this._update.$set[fieldName]) return next(); //If password is not updated:

        //Hash the password:
        const hashedPassword = await bcrypt.hash(this._update.$set[fieldName], saltRounds);
        
        //Create set object to preserve fieldName as key:
        let set = {};
        set[fieldName] = hashedPassword;

        //Set hashed password:
        this.set(set);
    });

    //Return MongoDB Schema:
    return Schema;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK JWT:
// Checks for the existence of a JWT and validates it to protect itself from unwanted requests.
//--------------------------------------------------------------------------------------------------------------------//
const checkJWT = (req, res, next) => {
    //Get bearer token from headers:
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    //Validate that token exists:
    if(!token){
      res.status(401).send({ success: false, message: currentLang.jwt.check_empty_token });
      return;
    }

    //Sanitize header token: 
    if(token.startsWith('Bearer ')){
      token = token.slice(7, token.length);
    }

    //Validate header token:
    if(token){
      jwt.verify(token, mainSettings.AUTH_JWT_SECRET, (err, decoded) => {
        if(err){
          return res.status(401).send({ success: false, message: currentLang.jwt.check_invalid_token, error: err.message });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    }
};
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export middlewares:
module.exports = {
    allowedValidate,
    isPassword,
    checkJWT
};
//--------------------------------------------------------------------------------------------------------------------//