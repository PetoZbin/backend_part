const competitionService = require("../services/competition.services");
const ErrorHandler = require("../middlewares/errors");


//pridanie novej sutaze
exports.registerCompetition = (req, res, next) => {

    competitionService.registerCompetition(req.body, (error, result) => {

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


exports.addCompetitor = (req, res, next) => {

    competitionService.addCompetitor(req.body, (error, result) => {

        if(error){

          return  ErrorHandler.errorHandler(error, req, res,next);
            //console.log(res.status)
           //return ErrorHandler.errorHandler(error).send();
            //return next(error);
        }
        return res.status(200).send(
            {
                message: "Success",
                data: result,
            }
        );
    });
};

exports.updateCompetitorOnStart = (req, res, next) => {

    competitionService.updateCompetitorOnStart(req.body, (error, result) => {

        if(error){

            return  ErrorHandler.errorHandler(error, req, res,next);
        }
        return res.status(200).send(
            {
                message: "Success",
                data: result,
            }
        );
    });
};

exports.updateLeaderBoard = (req, res, next) => {

    competitionService.updateLeaderBoard(req.body, (error, result) => {

        if(error){

            return  ErrorHandler.errorHandler(error, req, res,next);
        }
        return res.status(200).send(
            {
                message: "Success",
                data: result,
            }
        );
    });
};

exports.leaveOngoingCompetition = (req, res, next) => {

    const competitorId = req.params.competitorId;
    const competitionId = req.params.competitionId;

    competitionService.leaveOngoingCompetition({competitorId, competitionId}, (error, result) => {

        if(error){

            return  ErrorHandler.errorHandler(error, req, res,next);
        }
        return res.status(200).send(
            {
                message: "Success",
                data: result,
            }
        );
    });
};

exports.getWaypointById = (req, res, next) => {

    const waypointId = req.params.waypointId;

    competitionService.getWaypointById({waypointId},(error, result) => {

        if(error){

            return  ErrorHandler.errorHandler(error, req, res,next);
        }
        return res.status(200).send(
            {
                message: "Success",
                data: result,
            }
        );
    });
};

exports.getNextWaypoint = (req, res, next) => {

    const competitionId = req.params.competitionId;
    const waypointId = req.params.waypointId;

    competitionService.getNextWaypoint({competitionId, waypointId},(error, result) => {

        if(error){

            return  ErrorHandler.errorHandler(error, req, res,next);
        }
        return res.status(200).send(
            {
                message: "Success",
                data: result,
            }
        );
    });
};

exports.removeCompetitor = (req, res, next) => {

    const competitorId = req.params.competitorId;
    const competitionId = req.params.competitionId;

    competitionService.removeCompetitor({competitorId, competitionId}, (error, result) => {

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

//zmazanie sutaze
exports.removeCompetition = (req, res, next) => {

    const competitorId = req.params.competitorId;
    const competitionId = req.params.competitionId;

    competitionService.removeCompetition({competitionId, competitorId}, (error, result) => {

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

exports.transferNft = (req, res, next) => {

    const tokenId = req.params.tokenId;
    const recipientAddress = req.params.recipientAddress;

    competitionService.transferNft({tokenId, recipientAddress}, (error, result) => {

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

//nacitanie sutazi podla oblasti
exports.competitionsByMunicipality = (req, res, next) => {

    competitionService.competitionsByMunicipality(req.params.municipalities, (error, result) => {

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

exports.getCompetitionById = (req, res, next) => {

    competitionService.getCompetitionById(req.params.competitionId, (error, result) => {

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


exports.getUserCompetitionsByUserId = (req, res, next) => {

    console.log(req.params)


    competitionService.getUserCompetitionsByUserId(req.params.userId, (error, result) => {

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

exports.getBasicFinishedCompetitionsByUser = (req, res, next) => {

    console.log(req.params)
    const userId = req.params.userId;
    const pageNum = req.params.page;
    const itemsPerPage = req.params.maxItems;

    competitionService.getBasicFinishedCompetitionsByUser({userId, pageNum,itemsPerPage}, (error, result) => {

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