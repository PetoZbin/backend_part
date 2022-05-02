const web3 = require("web3");
const Moralis = require("moralis/node");
const User = require("../models/user.model");
const Base64 = require("jsonwebtoken");
const util = require('util');
const fetch = require("node-fetch");
const {ValidationError, ForbiddenError} = require("../middlewares/errors");

const APP_ID = "rELbDT6WE5E0pRLST3xFPLm3VJCY0NPyoAsZKDS0";      //moralis API key
const M_MKEY = "H3oWatbqt0zk5Dw4QvLKWcNvGSAXnRywIzfQ9g04";      //moralis masterkey
const SERVER_URL = "https://qoosg0bvpmho.usemoralis.com:2053/server"    // moralis server
const CHAIN = "mumbai"      // siet na ktorej je smart kontrakt
//const CONTRACT_ADDRESS = "0xEF2F23b6936F18249777df894544EDEf9d7145aF" //erc1155
//const CONTRACT_ADDRESS = "0x3252a61658Ac6CAC68eBE6EDDFE2cf92234c0795";   //erc721

const CONTRACT_ADDRESS = "0x696cF7705AE83936875E257C469AF6c305346112";  //erc721 aktualny

//const fetch = require('node-fetch');    //node fetch - http requests

async function getNFTMetadata(nftId,callback){       //funkcia nataha metadata k uzivatelovym nftckam

    if (nftId === undefined) {

        return callback({message: "nftId not defined!"});
    }

    //dotazujem moralis API

    try{
        await Moralis.start({serverUrl: SERVER_URL, appId: APP_ID});
    }catch (error){
        console.log(error);
        return callback(new ForbiddenError("Moralis provider not responding!"))
    }

    try{

        const options = {chain: CHAIN, address: CONTRACT_ADDRESS, token_id: nftId};
        let metadata = await Moralis.Web3API.token.getTokenIdMetadata(options);
        return callback(null, metadata);

    }catch(error){
        console.log(error);
        return callback({message: "token with id: " + nftId +" not existing!"});
    }

}

async function persistMetadata(metafactory, callback){   // vracia url, pod ktorou je mozne dostat metadata

    if((metafactory === null) || metafactory === undefined){

        return callback({message: "metafactory object not defined!"});
    }

    if(!checkInputs(metafactory)){
        return callback({message: "metafactory object variables not valid!"});
    }


    const extension = findExtension(metafactory.imgFile);

    if(extension === undefined){
        return callback({message: "Sent image file data not valid!"})
    }

    // moralis file object (meno.png, base 64 subor)

    try{
        // ukladanie obrazku ipfs, pomocou moralis kniznice
        await Moralis.start({serverUrl: SERVER_URL, appId: APP_ID, masterKey: M_MKEY});
        const imgUri = await uploadImg(metafactory, extension);
        console.log(imgUri)
        //ukladanie metadat ipfs pomocou moralis
        const metaUri = await uploadMetadata(metafactory, imgUri);
        //console.log("metauri");
        console.log(metaUri);
        return callback(null, {uri: metaUri})

    }catch(err){

        return callback({message: "File upload not succesfull!"});
    }
}

function checkInputs(metafactory){

    if((metafactory.imgFile === undefined) || (metafactory.imgFile === "")){    //file input empty
        console.log("file input empty!")
        return false;
    }

    if((metafactory.name === "") || (metafactory.name.length === 0)){
        console.log("empty name field!")
        return false;
    }

    if((metafactory.desc === "") || (metafactory.desc.length === 0)){
        console.log("empty description field!")
        return false;
    }

    return true;
}

function findExtension(encodedImg){
    //decLoverCase je mime type
    let decLowerCase = encodedImg.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];   //regex sluziaci na mime type ziskanie

    // const buffer = Buffer.from(encodedImg, 'base64');
    //
    // var decoded = buffer.toString();  //Base64. .decode(encodedImg);
    //
    // var decLowerCase = decoded.toLowerCase();
    //
    if(decLowerCase.indexOf('png') !== -1){
        return "png";
    }
    else if((decLowerCase.indexOf('jpg') !== -1) || (decLowerCase.indexOf('jpeg') !== -1)){

        return "jpg";
    }
    else return undefined;
}

async function uploadImg(metafactory, extension){

    let imageFile = new Moralis.File(metafactory.name + "." + extension, {base64 : metafactory.imgFile});
    await imageFile.saveIPFS({useMasterKey:true});//.then(file => console.log(file.url())); //ulozenie za pouzitia ipfs protokolu
    //link https brana na zobrazenie ipfs suboru
    return imageFile.ipfs();
}

async function uploadMetadata(metafactory, uri){

//todo: script injection
    const metadata = {
        name:  metafactory.name.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        description: metafactory.desc.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        image: uri.toString()
    };

    const jsonMetadata = new Moralis.File("metadata.json", {base64: btoa(JSON.stringify(metadata))});
    await jsonMetadata.saveIPFS({useMasterKey:true});

    return jsonMetadata.ipfs();
}


async function getNftsByAddress(address, callback) {

      //adresa ku ktorej hladam NFT tokeny
    //nalistuj nftcka
    try{

        await Moralis.start({serverUrl: SERVER_URL, appId: APP_ID});

    }catch (error){
        console.log(error);
        return callback(new ForbiddenError("Moralis provider not responding!"))
    }


    const options = {chain: CHAIN, address: address};

    let numNfts;

    try{
        numNfts = await Moralis.Web3.getNFTsCount(options);
    }catch (error){
        console.log(error);
        return callback(new ForbiddenError("Moralis provider error"))
    }


    console.log(numNfts);

    if (numNfts > 0){   // ak ma uzivatel nejake nftcka

        let userNfts;

        try{
            userNfts = await Moralis.Web3.getNFTs(options); // nacita nftcka uzivatela
        }catch (error){
            console.log(error);
            return callback(new ForbiddenError("Moralis provider error"))
        }

        let meta_array = []

        for(const elem of userNfts){

            // nft cudzich kontraktov nepodporujem
            if((elem.token_address.toString().toLowerCase() !== CONTRACT_ADDRESS.toLowerCase())
                || (elem.contract_type !== ('ERC721')) || !validateUrl(elem.token_uri)){ continue;}

            console.log(elem);

            try {
                const meta_elem = await fetchMetadata(elem);
                meta_array.push(meta_elem);
            }catch (error) {
                console.log(error)
                //return callback(error);
            }
        }
        return callback(null, meta_array);
    }
    return callback({message: "No nfts for this user"})
}

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

    const resp = await fetch(token.token_uri)
        .then(res => res.json())
        .catch((error) => {
        console.log(error);
    });

        return prepareMetadata(resp, token.token_id, token.token_address);
}
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

        if((metadata.image !== undefined) && (metadata.image.url !== undefined)){
            correct_metadata.image = metadata.image.url;
        }
    }

    return correct_metadata;
}

function validateUrl(url_str){      // na zaklade zdroja: https://stackoverflow.com/a/43467144

    let url;
    try {
        url = new URL(url_str);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";

}


module.exports = {getNFTMetadata, persistMetadata, getNftsByAddress};