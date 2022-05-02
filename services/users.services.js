const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth.js");
const web3 = require("web3");
const Moralis = require('moralis/node');
const fetch = require('node-fetch');
const userValidator = require('../validators/user_validators')
const bcryptjs = require("bcryptjs");
const {ForbiddenError} = require("../middlewares/errors");


const APP_ID = "rELbDT6WE5E0pRLST3xFPLm3VJCY0NPyoAsZKDS0";      //moralis API key
const SERVER_URL = "https://qoosg0bvpmho.usemoralis.com:2053/server"    // moralis server
const CHAIN = "mumbai"      // siet na ktorej je smart kontrakt
//const CONTRACT_ADDRESS = "0xEF2F23b6936F18249777df894544EDEf9d7145aF" //erc
//const CONTRACT_ADDRESS = "0x3252a61658Ac6CAC68eBE6EDDFE2cf92234c0795";   //erc721 - pouzivam teraz
const CONTRACT_ADDRESS = "0x696cF7705AE83936875E257C469AF6c305346112";  //erc721 aktualny

// db imports  Mysql2 ↓
const db = require('../db/db')
const dbHelper = require('../db/db.helper')
const userDao = require('../models/user.dao')
const addressDao = require('../models/address.dao')
const {emptyOrRows} = require("../db/db.helper");

async function login({username, password}, callback){

    console.log(username);
    console.log(password);
   // const user = await User.findOne({username});    //funkcia mongoose - najde usera v db

    try {

        let user = await userDao.getUserByUsername(username);

        if (user){

            if (bcrypt.compareSync(password, user.password)) {

                const token = auth.generateAccessToken(username);
                user.password = undefined;
                user.token = token;
                user.addresses = prepareAddresses(await addressDao.getAddressesByUserId(user.userId));

                return callback(null, user);
            } else {

                return callback({message: "Invalid username/password"});
            }
        }
        else {
            return callback ({message: "User with credentials not exists"});
        }

    }catch (error){

        return callback(error);
    }

    function prepareAddresses(addressesObjArray){

        let addrExportFormatArray = []

        for (const address of addressesObjArray){
            addrExportFormatArray.push(address.address);
        }

        return addrExportFormatArray;
    }

    //check ci naslo


    // if(user != null){
    //
    //     if (bcrypt.compareSync(password, user.password)){       //hashovane hesla - porovnanie spravnosti vlozeneho hesla
    //
    //         const token = auth.generateAccessToken(username);
    //         return callback(null, {...user.toJSON(), token});
    //     }
    //     else {
    //
    //         return callback({
    //             message: "Invalid username/Password"
    //         });
    //     }
    // }
    // else {
    //
    //     return callback({
    //         message: "User with credentials not exists"
    //     });
    // }

}


async function metamaskLogin(addressObj, callback){
    //byvala implementacia pomocou mongoDB

    // const user = await User.findOne({address: address});    //funkcia mongoose - najde usera v db
    //
    // //check ci naslo
    //
    // if(user != null){
    //
    //         const token = auth.generateAccessToken(user.username);
    //         return callback(null, {...user.toJSON(), token});
    //
    // }
    // else {
    //
    //     return callback({
    //         message: "User with credentials not exists"
    //     });
    // }


    try {

        let user = await userDao.getUserByAddress(addressObj.address[0]);

        if (user){

                const token = auth.generateAccessToken(user.username);
                user.password = undefined;
                user.token = token;
                user.addresses = prepareAddresses(await addressDao.getAddressesByUserId(user.userId));

                console.log(user)

                return callback(null, user);
        }
        else {
            return callback ({message: "User with address not exists"});
        }

    }catch (error){

        return callback(error);
    }
}


function prepareAddresses(addressesObjArray){

    let addrExportFormatArray = []

    for (const address of addressesObjArray){
        addrExportFormatArray.push(address.address);
    }

    return addrExportFormatArray;
}

async function register(params, callback){

    let error_msg = {

        isValid: true,
        message: "",
        username: "",
        password: "",
        address: "",
        email: ""
    }


    if ((params.username === undefined) || (params.password === undefined)
        || (params.address === undefined) || (params.email === undefined)) {

        error_msg.message = "Registration data in wrong format";
        error_msg.isValid = false;
        return callback({message: JSON.stringify(error_msg)});
    }

    let validation_response = await userValidator.validateRegistration(params, error_msg)

    if(!validation_response.isValid){
        //console.log(validation_response);
        return callback({message: JSON.stringify(validation_response)});
    }

    const salt = bcryptjs.genSaltSync(10);
    params.password = bcryptjs.hashSync(params.password, salt);

    try{

            if ((await userDao.insertUser(params)).affectedRows){  //ak vlozil, vloz adressu a k nej foreign key user id

                console.log("hello")

                const user = await userDao.getUserByUsername(params.username);

                if (!user){

                    return callback(new ForbiddenError("User could not be saved"));
                }

                if ((await addressDao.insertAddress(user.userId, params.address)).affectedRows){
                    user.password = undefined;
                    return callback(null, user)
                }
                else return callback(new ForbiddenError("Address could not be saved"));
            }
    }catch (error){

        return callback(new ForbiddenError(error))
    }


    // if (await checkAddressExists(params.address)){
    //     return callback(new ForbiddenError("Address already used by another user!"));
    // }




    //ked sa user registruje, hned sa vytvori salt
   // req.body.password = bcryptjs.hashSync(password, salt);

    // const prepUser = {
    //
    //     username: params.username,
    //     password: bcryptjs.hashSync(params.password, bcryptjs.genSaltSync(10)), //zahashuj heslo
    //     email: params.email,
    //     addresses: [params.address]
    // }
    //
    // console.log(prepUser);
    //
    // const user = new User(prepUser);
    //
    // user.save()
    //     .then((reg_response) => {
    //
    //         let response = {
    //
    //             message: 'success',
    //             email: reg_response.email,
    //             username: reg_response.username,
    //             id: reg_response.id,
    //
    //         }
    //
    //         return callback(null, response);
    //     })
    //     .catch((error) => {
    //
    //         return callback(error);
    //     });
}



async function addAddress(params, callback){

    let error_msg = {
        isValid: true,
        message: "",
        userId: "",
        address: ""
    }

    if ((params.userId === undefined) || (params.address === undefined)) {

        error_msg.message = "Data in wrong format";
        error_msg.isValid = false;
        return callback({message: JSON.stringify(error_msg)});
    }

    if(!await userValidator.validateAddress(params.address)){

        error_msg.message = "Address not valid";
        error_msg.address = "Address not valid";
        error_msg.isValid = false;
        return callback({message: JSON.stringify(error_msg)});
    }

    try {
        const usersHasAddress = (await addressDao.checkUserHasAddress(params.userId, params.address)).exists;

        console.log(usersHasAddress)

        if (usersHasAddress){

            return callback(null, {message: 'Address already in DB', userId: params.userId});
        }
    }catch (error) {

        console.log(error);
        return callback(error);
    }



        addressDao.insertAddress(params.userId, params.address)
            .then(result => {
                if (result.affectedRows){
                    return callback(null, {message: 'Address successfully added', userId: params.userId});
                }
                else return callback(new ForbiddenError('Address already used!'))
            }
        ).catch(error => {

            console.log(error);

            if (error.code === 'ER_DUP_ENTRY'){
               return callback(new ForbiddenError('Another users address!'));
            }

            return callback(new ForbiddenError(error));
        });

    // User.findOneAndUpdate({"_id":params.userId},{
    //     $addToSet: {addresses: params.address}
    // },{new: true, safe: true, upsert: true }).then((result) => {
    //     let response = {
    //         message: 'Address successfully added',
    //         userId: params.userId
    //     }
    //     return callback(null, response);
    // }).catch((error) => {
    //
    //     return callback(error);
    // });
}


async function deleteUsersAddress(params, callback){

    let error_msg = {
        isValid: true,
        message: "",
        userId: "",
        address: ""
    }

    if ((params.userId === undefined) || (params.address === undefined)) {

        error_msg.message = "Data in wrong format";
        error_msg.isValid = false;
        return callback({message: JSON.stringify(error_msg)});
    }

    addressDao.deleteAddress(params.address)
        .then(res =>{

            if (res.affectedRows){

                return callback(null, {message: 'Address successfully removed'});
            }
            else  return callback("Unable to remove address!");
        })
        .catch(error =>{
            console.log(error);
            return callback(new ForbiddenError(error.message));
        })


    // User.findOneAndUpdate({"_id":params.userId},{
    //     $pull: {addresses: params.address}
    // },{new: true, safe: true}).then((result) => {
    //     let response = {
    //         message: 'Address successfully removed',
    //     }
    //     return callback(null, response);
    // }).catch((error) => {
    //
    //     return callback(error);
    // });
}


//toto sa uz nepouziva
async function getUserNfts(userId,callback){       //funkcia nataha metadata k uzivatelovym nftckam

    if (userId === undefined) {

        return callback({message: "UserId not defined!"});
    }

    const user = await User.findOne({userId});  //vrati usera
    //console.log(user.toJSON());
    if (user != null){
       // return callback(null, {address: user.address}); //testovacie
        const address = user.address;   //adresa ku ktorej hladam NFT tokeny
        //nalistuj nftcka
        await Moralis.start({serverUrl: SERVER_URL, appId: APP_ID});

        const options = {chain: CHAIN, address: address};
        let numNfts = await Moralis.Web3.getNFTsCount(options);

        console.log(numNfts);

        if (numNfts > 0){   // ak ma uzivatel nejake nftcka

            let userNfts = await Moralis.Web3.getNFTs(options); // nacita nftcka uzivatela

            let meta_array = []
            for(const elem of userNfts){

                const meta_elem = await fetchMetadata(elem);
                meta_array.push(meta_elem);
            }

            return callback(null, meta_array);

        }
        return callback({message: "No nfts for this user"});

    }


}

//nepouziva sa
async function fetchMetadata(token){
        console.log("fetch");
       // console.log(token);

        if(token.token_uri === undefined || token.token_uri === ""){

            let correct_metadata = {
                token_id: token.token_id,
                token_address: token.token_address,
                name : "no name NFT",
                description: "no description",
                image: "img/no_cross.png"
            }

            return correct_metadata;
        }

        const resp = await fetch(token.token_uri).then(res => res.json());

        try {
            return prepareMetadata(resp, token.token_id, token.token_address);
        }catch (e) {
            console.log('Null ptr exception');
        }
}

//nepouziva sa
function prepareMetadata(metadata, token_id, token_address){     //function for getting metadata to correct form (if not consistent)

    let correct_metadata = {
        name : "no name NFT",
        description: "no description",
        image: "img/no_cross.png",
        token_id: token_id,
        token_address: token_address
    }

    if(metadata.name !== undefined && metadata.name !== ""){
        correct_metadata.name = metadata.name;
    }

    if(metadata.description !== undefined && metadata.description !== ""){
        correct_metadata.description = metadata.description;
    }

    if((metadata.image !== undefined) && (typeof metadata.image == 'string' || (metadata.image instanceof String))){

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


function validatePassword(password){

    const pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
    return password.match(pattern);
}





module.exports = {login, metamaskLogin, register, getUserNfts, addAddress, deleteUsersAddress};