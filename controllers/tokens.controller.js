const tokensService = require("../services/tokens.services");
const userService = require("../services/users.services");

exports.getNFTMetadata  = (req, res, next) => {

    const nftId = req.params.nftId;
    console.log(nftId);

    tokensService.getNFTMetadata(nftId, (error, result) => {

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

exports.saveMetadata = (req, res, next) => {

    const metafactory = req.body;     //prichadza string, string, base64 kodovany obrazok

    tokensService.persistMetadata(metafactory, (error, result) => {

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

exports.getNftsByAddress = (req, res, next) => {

    const address = req.params.address;
    console.log(address);

    tokensService.getNftsByAddress(address, (error, result) => {

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