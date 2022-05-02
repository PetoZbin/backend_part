
const ErrorHandler = require("../middlewares/errors");
const notifService = require("../services/notification.services");

exports.getUserNotifs = (req, res, next) => {

    console.log(req.params)
    const userId = req.params.userId;

    notifService.getUserNotifs({userId}, (error, result) => {

        if(error){
            return ErrorHandler.errorHandler(error, req, res, next);
        }
        return res.status(200).send(
            {
                message: "Success",
                data: result,
            }
        );
    });
};