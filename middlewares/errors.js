//const {Error} = require("mongoose");

class ValidationError extends Error{

    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }

}

class ForbiddenError extends Error{

    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
    }

}


function errorHandler(err, req, res, next){


    if(typeof err === "string"){

        return res.status(400).send(err);
    }

    if(err instanceof ValidationError){

        return res.status(400).send(err.message);
    }

    if(err instanceof ForbiddenError){

        return res.status(403).send(err.message);
    }

    if(typeof err === "UnauthorizedError"){

        return res.status(401).send(err.message);
    }

    //custom 500 serverova chyba
    return res.status(500).send(err.message);

}



module.exports = {
    errorHandler, ValidationError, ForbiddenError
};