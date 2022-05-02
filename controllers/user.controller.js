const bcryptjs = require('bcryptjs');
const userService = require("../services/users.services");
const ErrorHandler = require("../middlewares/errors");

exports.register = (req, res, next) => {

    userService.register(req.body, (error, result) => {

        if(error){

            return next(error);
        }
        return res.status(200).send(
            {
                message: "Success",
                data: result,
            }
        );
    });
};

exports.login = (req, res, next) => {

        const {username, password} = req.body;

        userService.login({username, password}, (error, result) => {

            if (error) {
                console.log(error.toString());
                return next(error);
            }
            return res.status(200)
                .setHeader('Content-Type', 'application/javascript')
                .setHeader("Access-Control-Allow-Origin", "*")
                .setHeader("X-Content-Type-Options", "nosniff")
                .send(
                {
                    message: "Success",
                    data: result,
                });
        });
    };

exports.metamaskLogin = (req, res, next) => {

        const {address} = req.body;

        userService.metamaskLogin({address}, (error, result) => {

            if (error) {
                console.log(error.toString());
                return next(error);
            }
            return res.status(200)
                .setHeader('Content-Type', 'application/javascript')
                .setHeader("Access-Control-Allow-Origin", "*")
                .setHeader("X-Content-Type-Options", "nosniff")
                .send(
                    {
                        message: "Success",
                        data: result,
                    });
        });
    };



exports.userProfile = (req, res, next) => {

        return res.status(200).json({message: "Authorized user"});
    };

exports.getUserNfts  = (req, res, next) => {

     const userId = req.params.userId;
     console.log(userId);

    userService.getUserNfts(userId, (error, result) => {

        if (error) {
            return next(error);
        }
        return res.status(200)
            .setHeader('Content-Type', 'application/json')
            .setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("X-Content-Type-Options", "nosniff")
            .send(
                {
                    message: "Success",
                    data: result,
                });
    });
};


exports.addAddress = (req, res, next) => {

    const {userId, address} = req.body;

    userService.addAddress({userId, address}, (error, result) => {

        if (error) {
            return  ErrorHandler.errorHandler(error, req, res,next);
        }
        return res.status(200)
            .setHeader('Content-Type', 'application/javascript')
            .setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("X-Content-Type-Options", "nosniff")
            .send(
                {
                    message: "Success",
                    data: result,
                });
    });
};


exports.deleteUsersAddress = (req, res, next) => {  //zmazanie adresy uzivatela

    const userId = req.params.userId;
    const address = req.params.address;

    userService.deleteUsersAddress({userId, address}, (error, result) => {

        if (error) {
            console.log(error.toString());
            return next(error);
        }
        return res.status(200)
            .setHeader('Content-Type', 'application/javascript')
            .setHeader("Access-Control-Allow-Origin", "*")
            .setHeader("X-Content-Type-Options", "nosniff")
            .send(
                {
                    message: "Success",
                    data: result,
                });
    });
};











function prepareMetadata(metadata){     //function for getting metadata to correct form (if not consistent)

    let correct_metadata = {
        name : "no name NFT",
        description: "no description",
        image: "img/no_cross.png"
    }

    if(metadata.name !== ""){
        correct_metadata.name = metadata.name;
    }

    if(metadata.description !== ""){
        correct_metadata.description = metadata.description;
    }

    if(typeof metadata.image == 'string' || (metadata.image instanceof String)){

        if(metadata.image !== ""){
            correct_metadata.image = metadata.image;
        }

    }
    else{

        if(metadata.image.url !== undefined){
            correct_metadata.image = metadata.image.url;
        }
    }



    return correct_metadata;
}

