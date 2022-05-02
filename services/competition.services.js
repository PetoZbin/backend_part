const Web3 = require("web3");
const ethTx = require('ethereumjs-tx');
const userValidator = require("../validators/user_validators");
const bcryptjs = require("bcryptjs");
const User = require("../models/user.model");

const CHAIN = "mumbai";
const NODE_URL = "https://speedy-nodes-nyc.moralis.io/7e552ee0a5c1d070a33196ac/polygon/mumbai";
const {CONTRACT_ABI} = require("../public/ABIs/erc721_at241");
const CONTRACT_ADDRESS = "0x696cF7705AE83936875E257C469AF6c305346112";  //erc721 aktualny


//mysql↓
const db = require('../db/db');
const dbHelper = require('../db/db.helper');
const competitionDao = require('../models/competition.dao.js');

const {CompetitionStates} = require("../enums/competitionStates");
const {CompetitorStates} = require("../enums/competitorStates");
const timehelper = require("../helpers/time.helper");
const competitionHelper = require("../helpers/competition.helper");

//user↓
//const PRIVATE_KEY = "392d764c2fbd8a18c9fe701ce8e6fc8ed9f5f3b1afa04fc74ee5dae90f3f527e";
//const SERVER_ETH_ADDRESS = "0x69C8454481b50075FB1E63a0f8f8e2b352a20f97";


//server↓
const PRIVATE_KEY = "959329d6c93b5f1b77670b32fad2873baad9878f81f6bf66afcf0659c54e9477";
const SERVER_ETH_ADDRESS = "0x94C05d74f3E26474dd84D061e9CeA8F138a8f600";



const CompetitionModel = require("../models/competition.model");
const {Competition, Waypoint} = require("../models/competition.model");
const {ValidationError, ForbiddenError} = require("../middlewares/errors");
const {sign} = require("jsonwebtoken");
const e = require("express");
const {getLeaderBoardByWaypointId} = require("../models/competition.dao");
const Console = require("console");
const ObjectId = require('mongoose').Types.ObjectId;

async function registerCompetition(params, callback){

    let error_msg = {

        isSuccess: false,
        message: "",
    }


    let competitionDb = {
        organizerId : params.organizerId,
        organizerAddress : params.organizerAddress,
        name : params.name,
        municipality: params.municipality,
        metaUrl : params.metaUrl,
        nftId : params.nftId,
        nftName : params.nftName,
        compDateTime : params.compDateTime,
        durationMins : params.durationMins,
        maxCompetitors : params.maxCompetitors,
        blockHash : params.blockHash
    }

    console.log(params)


    try {

        if (! (await checkUniquePrize(params.nftId))){

            return callback(new ForbiddenError("NFT already used for another competition!"));
        }

        const res = await competitionDao.insertCompetition(competitionDb);

         if(res.affectedRows && res.insertId){
             //podarilo sa vlozit sutaz - nasleduje vlozenie waypointov (insertId je id prave vlozenej sutaze)

             params.competitionId = res.insertId;

             const waypointsDB = prepareWaypoints(params.wayPointList, res.insertId);

             if (waypointsDB.length < 2){
                 await onCompetitionNestedSavingFailed(params.competitionId, params.organizerId);
                 return callback(new ForbiddenError("Waypoints in wrong form"));
             }

             let wayRes = await competitionDao.insertWaypoints(waypointsDB,res.insertId);


             if ((!wayRes.affectedRows) || (wayRes.affectedRows !== waypointsDB.length)){

                 if (await onCompetitionNestedSavingFailed(params.competitionId, params.organizerId)){

                     return callback("Waypoints bulk saving error!");
                 }
             }
             else {

                 return callback(null, params);
             }

             // vlozenie spojovacej tabulky user_sompetition
             //
             // wayRes = await competitionDao.insertUserCompetition(params.organizerId, params.competitionId);
             //
             // if (!wayRes.affectedRows){
             //
             //     if (await onCompetitionNestedSavingFailed()){
             //
             //         return callback("UserCompetition table update error!");
             //     }
             // }
             // else {
             //
             //     return callback(null, params);
             // }

         }

    }catch (error){

        console.log(error)
        return callback(error);
    }

   // console.log(params);
   //
   // console.log(competitionDb);
   //
   //  const comp2save = new CompetitionModel.Competition(competitionDb);
   //
   // for (let waypoint of params.wayPointList){
   //
   //     const wp = new CompetitionModel.Waypoint(waypoint);
   //     //wp.save();
   //     comp2save.wayPointList .push(wp);
   // }

    // comp2save.save()
    //     .then((save_response) => {
    //
    //         let response = params;
    //
    //         return callback(null, response);
    //     })
    //     .catch((error) => {
    //
    //         return callback(error);
    //     });
}


async function onCompetitionNestedSavingFailed(competitionId, organizerId){  //zmaz sutaz

    const res = (await competitionDao.deleteCompetition(competitionId, organizerId)).affectedRows;

    if (res){

        return true;
    }
    return false;
}

async function checkUniquePrize(nftId){      // 1 nft moze byt ako cena v 1 sutazi v stave AWAITING alebo ongoing

    const res = await competitionDao.checkUniquePrize(nftId);

    if (res.exists){        // nft uz pouzite pre inu sutaz v stave awaiting / ongoing
        return false;
    }
    return true;
}

async function checkAlreadyCompetes(userId, competitionId){      // 1 nft moze byt ako cena v 1 sutazi v stave AWAITING alebo ongoing

    const res = await competitionDao.checkAlreadyCompetes(userId, competitionId);

    if (res.exists){        // uz prihlaseny
        return true;
    }
    return false;
}

function prepareWaypoints(waypointList, competitionId){

    try {

        if ((waypointList.length <2) || (competitionId === undefined)){
            return [];
        }

        //poradie premennych - na zadanie do insertu a isStart + isFinish
        let result = [];

        for(let i =0; i< waypointList.length; i++){


            if (Number(waypointList[i].seqNumber) !== (i+1)){       //prerusene poradie checkpointov
                return [];
            }

            let isStart = '0';
            let isFinish = '0';

            if (Number(waypointList[i].seqNumber) === 1){

                isStart = '1';
            }

            if (Number(waypointList[i].seqNumber) === waypointList.length){ //checkpoint ma sekvencne cislo s pociatkom 1
                isFinish = '1';
            }

            result.push(

                 [competitionId.toString(),
                 waypointList[i].lat,
                waypointList[i].lng,
                waypointList[i].thoroughfare,
                waypointList[i].seqNumber,
                isStart,
                isFinish]
            );
        }

        if (result.length < 2){

            return [];
        }

        return result;

    }catch (error){
        return [];
    }
}

async function addCompetitor(params, callback){

    let error_msg = {

        isSuccess: false,
        message: "",
    }

    console.log(params);

    //console.log(params)
    if ((params.competitionId === undefined) || (params.userId === undefined)
        || (params.competitorEthAddress === undefined) || (!Web3.utils.isAddress(params.competitorEthAddress))){

        return callback(new ValidationError("Wrong parameters!"));
    }

    try {
        if (await checkAlreadyCompetes(params.userId, params.competitionId)){
            return callback(new ForbiddenError(("Already joined!")));
        }
    }catch (error){

        return callback(error); //databazova chyba
    }


    const newCompetitor = {
        competitorId : params.userId,
        competitionId : params.competitionId,
        competitorEthAddress : params.competitorEthAddress,
        active : 0,
        competitorStatus : CompetitorStates.JOINED,
    }

    competitionDao.insertCompetitor(newCompetitor)
        .then(res =>{

            if (res.affectedRows){

                return callback(null,{
                    isSuccess : true,
                    message: 'User successfully added',
                    userId: params.userId
                });
            }
        })
        .catch(error => {
            return callback(error);
        })

   // mongo implementacia↓
   //  let comp = await Competition.findOne({"_id": new ObjectId(params.competitionId)});
   // // const user = await User.findOne({"_id": userId});
   //
   //  if ((comp!==null)){
   //
   //      if (!checkIfInTime(comp.compDateTime)){
   //          return callback(new ValidationError("You are late - cannot join!"));
   //         // return callback({message: "You are late - cannot join!"});
   //      }
   //
   //      if (!(comp.competitorsList.length < comp.maxCompetitors)){
   //
   //          return callback(new ValidationError("Max competitors exceeded - cannot join!"));
   //          //return callback({message: "Max competitors exceeded - cannot join!"});
   //      }
   //
   //      let newCompetitor = new CompetitionModel.Competitor();
   //      newCompetitor.competitorId = params.competitorId;
   //      newCompetitor.competitorEthAddress = params.competitorEthAddress;
   //      newCompetitor.competitorName = params.competitorName;
   //      newCompetitor.confirmed = false;
   //      newCompetitor.status = 'JOINED';
   //
   //      for (let competitor of comp.competitorsList){
   //
   //          if ((competitor.competitorId === newCompetitor.competitorId) || (competitor.competitorName === newCompetitor.competitorName)
   //              || (competitor.competitorEthAddress === newCompetitor.competitorEthAddress)){
   //              return callback(new ForbiddenError(("Already joined!")));
   //              //return callback({message: "Already joined!"});
   //          }
   //      }
   //
   //      // ak sa uzivatel este nenachadza v sutazi v zozname ucastnikov
   //
   //      Competition.findOneAndUpdate({"_id": new ObjectId(params.competitionId)},
   //          {
   //              $push : {competitorsList : newCompetitor}
   //
   //      },{new: true, safe: true, upsert: true }).then((result) => {
   //          let response = {
   //              isSuccess : true,
   //              message: 'User successfully added',
   //              userId: params.userId
   //          }
   //          return callback(null, response);
   //      }).catch((error) => {
   //
   //          return callback(error);
   //      });
   //  }
}

async function updateCompetitorOnStart(params, callback){    // ak sa uzivatel dostavi na start

    //aktualizuj stav sutaziaceho
    // aktualizuj stav - sutaziaci_sutaz - ak je sutaz ongoing - povol zmenu statusu uzivatela na performing
    //vsetky starsie sutaze, kde je uzivatel performing daj na status JOINED


    if ((params.competitionId === undefined) || (params.userId === undefined)){

        return callback(new ValidationError("Incorrect input format!"));
    }

    try {
        //len 1 sutaz prebehajuca pre uzivtaela v case = ostatne starsie stav ... PERFORMING => JOINED

        await competitionDao.updateOnMultiplePerformingCompetitions(params.userId);

        // aktualna sutaz ... competitorState => PERFORMING

        const res = await competitionDao.updateStatusOnNewStart(params.userId, params.competitionId);

        if (res.affectedRows){

            //vrati sa nasledujuci waypoint

            const res = await competitionDao.getWaypointByCompetitionAndSeqNum(params.competitionId, 1);

            if (res.length !== 1){
                return callback(new ForbiddenError("Competition problem. Start waypoint not present!"))
            }

            return callback(null, res[0]);

            // return callback(null, {
            //     isSuccess: true,
            //     message: 'User ' + params.userId + ' registered at start!',
            //     userId: params.userId
            // });
        }
        else {
            return callback(new ForbiddenError("Start conditions not fullfilled!"))
        }

    }catch (error){

        return callback(error);
    }

    // ziskaj posledne umiestnenie z leaderboardu pre dany waypoint
    // const newStanding = await resolvePosition(params.competitionId,1);
    //
    // if (newStanding < 1){       //poradie == standing
    //     return callback("Incorrect standing error");
    // }
    //
    // const leader = {
    //
    //     competitorId : params.competitorId,
    //     arrivalTime : new Date(),
    //     standing : newStanding,
    // }
    //
    // console.log(leader)

    // Competition.findOneAndUpdate(
    //     {
    //         "_id": new ObjectId(params.competitionId),
    //         "competitorsList.competitorId" : params.competitorId,
    //         'wayPointList.0.leaderboard.competitorId': {$nin: [params.competitorId]} //dobre
    //     },
    //     {
    //         $set : {'competitorsList.$.confirmed' : true},
    //         $push : {'wayPointList.0.leaderboard': leader}
    //
    //     },{new: true, safe: true, upsert: true }).
    // then(async (result) => {
    //     let response = {
    //         isSuccess: true,
    //         message: 'User ' + params.competitorId + ' registered at start!',
    //         userId: params.competitorId
    //     }
    //
    //    //await updateLeaderBoard(1, params.competitionId, params.competitorId);
    //
    //     return callback(null, response);
    // }).catch((error) => {
    //
    //     return callback(error);
    // });

    //console.log(await resolvePosition());
}

async function updateLeaderBoard(params, callback){    //uzivatel dosiahol checkpoint

    console.log(params)

    // po dosiahnuti waypointu pride sprava od uzivatela
    if ((params.competitionId === undefined) || (params.userId === undefined)
        || (params.waypointId === undefined) || (params.arrivalTime === undefined)){

        return callback(new ValidationError("Wrong parameters!"));
    }

    try {
        //kontrola pre duplicitu zapisu
        if (await checkAlreadyInLeaderBoard(params.userId, params.waypointId)){
            return callback(new ForbiddenError("Duplicite checkpoint data!"));
        }

        const res = await competitionDao.insertCheckpointEntry(params.userId,  params.waypointId, params.arrivalTime);

        if (!res.affectedRows){
            return callback("Entry could not be saved to leaderboard!")
        }

        //vraciam nasledujuci checkpoint

        //const nextWaypoint = await competitionDao.getNextWaypoint(params.competitionId, params.waypointId);

        return callback(null, [(await fetchCompetitionById(params.competitionId))]);    //vraciam celu sutaz - chcem notif. o vysledku

    }catch (error) {

        return callback(error);
    }

    //data pre uzivatela a checkpoint este neulozene ↓
   // let comp = await Competition.findOne({"_id": new ObjectId(params.competitionId)});


}

async function leaveOngoingCompetition({competitorId, competitionId}, callback){
    //uzivatelovi ostane pravo znova sa zucastnik, aktualizacia stavu ucastnika na stav QUIT
    // vymazanie checkpointov s id sutaze a id ucatnika, confirmed priznak (uz nepouzivany) na 0


    try {
        //ziskaj waypointy sutaze, pre ktore ma dany uzivatel zaznam
        const passedWaypoints = await competitionDao.getWaypointsAlreadyPassed(competitionId,competitorId);

        if (passedWaypoints.length === 0){     //este nema za sebou ziadny wp - netreba mazat
            return callback(null,{
                    isSuccess : true,
                    message: 'Leaderboard records removed!',
                    userId: competitorId
            });
        }

        // zmaz zaznamy leaderbordu pre kazdy z waypointov a ucastnika
        for (const waypoint of passedWaypoints){

            //ku kazdemu waypoint Id zmaz zaznam v db (recordId je id zaznamu v leaderboard tabulke)
            await competitionDao.deleteCompetitorsLeaderboard(competitorId, waypoint.recordId);
        }

        //skontroluj
        if ((await competitionDao.getWaypointsAlreadyPassed(competitionId, competitorId)).length === 0){

            //nastav status sutaziaceho na joined

            const res = await competitionDao.updateStatusOnUserGaveUp(competitorId, competitionId);

            if (res.affectedRows){
                return callback(null,{
                    isSuccess : true,
                    message: 'Leaderboard records removed!',
                    userId: competitorId
                });
            }
            else {
                return callback(new ForbiddenError("Leaving not successful!"));
            }

        }else {
            return callback(new ForbiddenError("Leaving not successful!"));
        }

    }catch (error){

        return callback(new ForbiddenError("Leaving not successful!"));
    }

}

async function getUserCompetitionsByUserId(userId, callback){

    if (userId === undefined){

        return callback(new ValidationError("Incorrect userId!"));
    }

    competitionDao.getUserCompetitionsByUserId(userId)
        .then(res =>{

            return callback(null, res);
        })
        .catch(error => {

            return callback(error);
        });

}


async function getWaypointById({waypointId}, callback){

    if (waypointId === undefined){

        return callback(new ValidationError("Invalid waypointId"));
    }

    competitionDao.getWaypointById(waypointId)
        .then(res =>{

            return callback(null, res);

        })
        .catch(error => {

            return callback(error);
        })

}

async function getNextWaypoint({competitionId, waypointId}, callback){

    if ((competitionId === undefined) || (waypointId === undefined)){

        return callback(new ValidationError("Invalid parameters"));
    }

    competitionDao.getNextWaypoint(competitionId, waypointId)
        .then(res =>{

            return callback(null, res);

        })
        .catch(error => {

            return callback(error);
        })

}

async function resolvePosition(competitionId, waypointSeqNumber){   //na zaklade requestu urci poradie bezca

    // v poli leaderboard zisti poslednu poziciu

    console.log(competitionId)
    console.log("↓")
    console.log(waypointSeqNumber)
    //
    // try{
    //
    //     const res = await CompetitionModel.Competition.findOne(
    //         {
    //             "_id": new ObjectId(competitionId),
    //             'wayPointList.$[p1]': {$elemMatch: { seqNumber: waypointSeqNumber} } ,
    //             {arrayFilters}
    //
    //         }).select('wayPointList.$').exec();
    //
    //
    //     console.log(res);
    //
    //     console.log("new position: " + (res.wayPointList[waypointSeqNumber].leaderboard.length +1));
    //
    //     return res.wayPointList[waypointSeqNumber].leaderboard.length +1;
    //
    // }catch (error){
    //
    //     console.log(error)
    //     return -1;
    // }



    //     .then(async (result) => {
    //         console.log(result.wayPointList[0].leaderboard.length +2)
    //     return result.wayPointList[0].leaderboard.length +1;    // 0 prvkov - prvy
    //
    // }).catch((error) => {
    //     return -1;
    // });

    return -1;

}


async function removeCompetitor({competitorId, competitionId}, callback){

    let error_msg = {

        isSuccess: false,
        message: "",
    }

    console.log(competitorId)
    console.log(competitionId)

    if ((competitionId === undefined) || (competitorId === undefined)){
        return callback(new ValidationError("Wrong parameters!"));
    }

     competitionDao.deleteCompetitor(competitorId, competitionId)
         .then(result => {

         if (result.affectedRows){
             return callback(null, {
                 isSuccess : true,
                 message: 'Competitor successfully deleted',
                 userId: competitorId
             });
         }
         else return callback(new ForbiddenError("No user deleted"));

        }).catch(error => {

            return callback(error);
     });

    // mongo ↓
   // let comp = await Competition.findOne({"_id": competitionId});
    // const user = await User.findOne({"_id": userId});

        // Competition.findOneAndUpdate(
        //     {
        //             _id : new ObjectId(competitionId),
        //             'competitorsList.competitorId' : {$in: competitorId}
        //     },
        //     {
        //         $pull : {'competitorsList' : {competitorId: competitorId}}
        //        // $pull : {'competitorsList' : {competitorId: userId}}
        //
        //     },{new: true, safe: true, upsert: true })
        //     .then((result) => {
        //         let response = {
        //             isSuccess : true,
        //             message: 'Competitor successfully deleted',
        //             userId: competitorId
        //     }
        //     return callback(null, response);
        // }).catch((error) => {
        //
        //     return callback(error);
        // });


   // return callback(new ValidationError("No competition with such ID!"));
}

async function removeCompetition({competitionId, competitorId}, callback){

    //console.log(params)
    if ((competitionId === undefined) || (competitorId === undefined)){

        return callback({message: "Wrong parameters!"});
    }

    //let comp = await Competition.findOne({_id : new ObjectId(competitionId)});   //najdi sutaz - treba previest cenu naspat poriadatelovi

    //najdi prislusnu sutaz sutaz

    try {

        const competition = await competitionDao.getCompetitionById(competitionId);

        if (competition === undefined){
            return callback(new ValidationError("No competition with such parameters found!"))
        }

        console.log(competition.organizerId);
        console.log(competitorId);

        if (competition.organizerId.toString() !== competitorId){
            return callback(new ForbiddenError("Only owner can cancel competition!"));
        }

        if (!Web3.utils.isAddress(competition.organizerAddress) || (competition.nftId === undefined)
            || (!Number.isInteger(Number(competition.nftId)))){
            return callback({message: "Invalid DB data error!"});
        }

        // prevod nft tokenu naspat ku organizatorovi
        const transferedOk = await performTransfer({tokenId: competition.nftId, recipientAddress: competition.organizerAddress});

        console.log(competition.nftId)
        console.log(competition.organizerAddress)
        console.log("receipt status = " + transferedOk);

        if (transferedOk){

            console.log("NFT back on organizer addr, removing from db");

            competitionDao.deleteCompetition(competitionId, competitorId)
                .then(res => {

                    if (res.affectedRows){

                        return callback(null, {
                                    isSuccess : true,
                                    message: 'Competition successfully deleted. Nft transfered.',
                                    competitorId: competitorId
                                    });
                    }else {
                        return callback("Problem with db removal"); //nemalo by nikdy nastat
                    }
                }).catch(error => {return callback(error);});

            //stara mongo impelentacia↓
            // Competition.deleteOne({"tokenId": tokenId, "organizerId" : competitorId})
            //     .then((result) => {
            //         let response = {
            //             isSuccess : true,
            //             message: 'Competition successfully deleted. Nft transfered.',
            //             competitorId: competitorId
            //         }
            //         return callback(null, response);
            //     })
            //     .catch((error) => {
            //
            //         return callback(error);
            //     });
        }
        else {
            return callback(new ForbiddenError("Returning of your nft failed!"));
        }


    }catch (error){
        console.log(error);
        return callback(error);
    }

        //cakam dokial uspesne neprevedie NFT - pride statis z receiptu - 0 alebo 1

}

async function competitionsByMunicipality(queryMunicipalities, callback){

    //parse params by ,

    const municipalities = parseMunicipalities(queryMunicipalities); //params je vo forme Mesto, okres - v geocoder maju niektore miesta len okres

    let error_msg = {

        isSuccess: false,
        message: "",
        username: "",
        password: "",
        address: "",
        email: ""
    }

    console.log(municipalities)

    if ((municipalities instanceof Array) && (municipalities.length < 1)){

        return callback(null, municipalities);   //nijaka sutaz ---> []
    }

    try {

        const competitionIdRes = await competitionDao.getCompetitionIdsByMunicipalities(municipalities);

        console.log(competitionIdRes)
        if (!competitionIdRes.length){
            return callback(null, []);
        }

        let competitions = [];

        for (let item of competitionIdRes){

            const competition = await fetchCompetitionById(item.competitionId);

            if (competition){
                competitions.push(competition);
            }
        }

        return callback(null ,competitions);
    }
    catch (error){
        return callback(error);
    }




    // mongodb ↓
    // let localCompetitions = await CompetitionModel.Competition.find({
    //     "municipality": {"$in" : municipalities}
    //
    // }).catch((error) => {
    //
    // return callback(error);
    // });
    //
    // if (!localCompetitions){
    //
    //     //nenasiel
    //     return callback(null, localCompetitions);
    // }
    // else {
    //     return callback(null, localCompetitions);
    // }

}


async function fetchCompetitionById(competitionId){

        let competitionRes = await competitionDao.getCompetitionById(competitionId);

        console.log(competitionRes)

        if (competitionRes === undefined){

            console.log("No competition found!");
            throw new ValidationError("No competition found!");
            //return null;
            //callback(new ValidationError("No competition found!"));
        }

        // naslo sutaz - dotiahnut waypointy

        let waypoints = await competitionDao.getWaypointsByCompetitionId(competitionId);

        if (waypoints.length <2){
           // return callback("Inconsistent DB data");
            throw new Error("Inconsistent DB data")
        }  // funkcia vrati [] pre ziadny vysledok


        //pre kazdy z waypointov dotiahni jeho leaderboard

        for (let i=0; i< waypoints.length; i++){
            waypoints[i].leaderboard = await competitionDao.getLeaderBoardByWaypointId(waypoints[i].waypointId);
        }

        // dotiahnutie pola sutaziacich

        const competitors = await competitionDao.getCompetitorsByCompetitionId(competitionId);

        competitionRes.wayPointList = waypoints;
        competitionRes.competitorsList = competitors;

        return competitionRes;

}


async function getCompetitionById(competitionId, callback){

    if (competitionId === undefined){
        return callback(new ValidationError("Invalid argument competitionId"));
    }

    //nacitaj sutaz

    try {

        return callback(null, [(await fetchCompetitionById(competitionId))]);

    }catch (error){

        return callback(error);
    }

    //mongo implementacia ↓

    // let competition = await CompetitionModel.Competition.findOne({
    //     "_id": new ObjectId(competitionId)
    // }).then((result) => {
    //
    //     return callback(null, [result]);
    //
    // }).catch((error) => {
    //     return callback(error);
    // });
}





function checkIfInTime(compdate){

    if (compdate instanceof Date){

        compdate = new Date(compdate - 60000) // minutu do sutaze je max co sa da prihlasit
        const now = new Date(Date.now());

        if (now < compdate){
            return true;
        }
    }

    return false;
}
                                                // na start sa da postavit 5 min pred sutazou
function checkIfInAttendStartTime(compdate){    //je potrebne sa dostavit na start minutu pred sutazou

    if (compdate instanceof Date){

        compdate = new Date(compdate - 60000) // minutu do sutaze je max co sa da prihlasit
        const now = new Date(Date.now());

        if (now < compdate){
            return true;
        }
    }

    return false;
}

function allowAttendStart(compdate){    //je potrebne sa dostavit na start minutu pred sutazou

    if (compdate instanceof Date){

        const dateTimeMaxLimit = new Date(compdate - (60000));    //doteraz sa da postavit na start - kto sa nedostavi 1 min pred startom vypadava
        const dateTimeMinLimit = new Date(compdate - (5*60000));    //odteraz sa da postavit na start - 5 min pred startom

        const now = new Date(Date.now());

        if ((now > dateTimeMinLimit) && (now < dateTimeMaxLimit)){    // (5 MIN before < NOW < 1 MIN before)
            return true;
        }
    }

    return false;
}

function parseMunicipalities(municipalitiesQuery){

    //2 obce oddelene delimiterom "1"

    let correctArray = [];

    if ((municipalitiesQuery !== undefined) && (typeof municipalitiesQuery === 'string')){

        let parsedArray = municipalitiesQuery.toString().split(",");

        for (let place of parsedArray){
            if (place.trim() !== ""){
                correctArray.push(place);
            }
        }
    }

    return correctArray;
}

function getLeaderBoard(waypointList, seqNumber) {

    console.log(waypointList)

    try {

        for (let waypoint of waypointList){

            console.log(seqNumber +"  "+waypoint.seqNumber)
            if (waypoint.seqNumber ===  Number(seqNumber)){


                return waypoint.leaderboard;
            }
        }

    }catch (error){

        return null;
    }

    return null;
}

async function checkAlreadyInLeaderBoard(competitorId, competitionId ,waypointId){

    const res = await competitionDao.checkAlreadyInLeaderBoard(competitorId, competitionId, waypointId);

    if (res.exists){        // uz su pre dany checkpoint a uzivatela udaje - posiela duplicitu
        return true;
    }
    return false;

    //mongo implementacia - uz neaktualne ↓
    // try{
    //     for (let leader of leaderboard){
    //
    //         if (leader.competitorId === competitorId){
    //             return true;
    //         }
    //     }
    //
    // }catch (error){
    //
    //     return false;
    // }
    // return false;
}


function persistWaypoints(waypointList){



    for (const item of waypointList){

        competition.save()
            .then((save_response) => {

                let response = competition;

                return callback(null, response);
            })
            .catch((error) => {

                return error;
            });


    }

}


async function performTransfer({tokenId, recipientAddress}){

    console.log("transfer token with id: " + tokenId);
    console.log("recipient address: " + recipientAddress);

    if ((tokenId === undefined) || (recipientAddress === undefined)
        || !Web3.utils.isAddress(recipientAddress) || isNaN(parseInt(tokenId))){

        return false; //callback(new ValidationError("Incorrect inputs for transfer!"));
    }

    let web3Provider = new Web3.providers.HttpProvider(NODE_URL);
    let web3 = new Web3(web3Provider);

    // na zaklade dokumentacie web3js: https://ethereum.org/lt/developers/tutorials/set-up-web3js-to-use-ethereum-in-javascript/


    const contract = new web3.eth.Contract (CONTRACT_ABI, CONTRACT_ADDRESS);
    let transaction = await contract.methods.performTransfer(tokenId, recipientAddress);

    let account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);

    try{

        const estGasPrice = parseInt(await web3.eth.getGasPrice());
        const estGasLimit = (await web3.eth.getBlock("latest")).gasLimit;
        const estGas =  await web3.eth.estimateGas({
            from: SERVER_ETH_ADDRESS,
            to: CONTRACT_ADDRESS,
            data: transaction.encodeABI(),
        });     //0.00058305

        let tippedGasPrice = Math.trunc(estGasPrice * 1.4); //okresanie desatin - wei je cele cislo
        const last_nonce = await web3.eth.getTransactionCount(SERVER_ETH_ADDRESS, 'latest');

        let options= {        // poplatok = celkovy pocet vypoctovych jednotiek * cena jednotky - gas*gasPrice (gas je vypoctova jednotka)
            from: web3.utils.toHex(SERVER_ETH_ADDRESS),
            data: transaction.encodeABI(),     //kodovane ABI rozhranie kontraktu
            gas: 50000, //web3.utils.toHex(estGas*3), //vycislenie pocet gas vypoct. jednotiek
            gasPrice: tippedGasPrice, //98000120320,//web3.utils.toHex(tippedGasPrice),   //cena 1 jednotky
            gasLimit: 70000,//web3.utils.toHex(estGasLimit), //max cena
            to: CONTRACT_ADDRESS,
            chainId: await web3.eth.getChainId(),
        };

        console.log(options)

        const signedTransaction = await web3.eth.accounts.signTransaction(options, account.privateKey); //podpis tranzakcie privat. klucom
        console.log(signedTransaction);

        const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        return receipt.status;
            // .once("receipt", receipt => {
            //
            //     console.log('Receipt: ', receipt);
            //     return receipt.status;  //0 failed - 1 success
            // })
            // .catch(error => {
            //     console.log(error.message);
            //     //return callback("error: " + error.message);
            //     return false;
            // });


    }catch (error){

        console.log(error.message);
        //return callback(error.message);
        return false;
    }

}

async function transferNft({tokenId, recipientAddress}, callback) {

   if (await performTransfer({tokenId, recipientAddress})){

       let response = {
           isSuccess : true,
           message: 'Nft with Id:' + tokenId + 'transfered to: ' + recipientAddress,
       }
       return callback(null, response);
   }
   else return callback("Tranfer failed!");
}


async function makeCompetitionsOngoing(){

    console.log("awaiting competitions to ongoing @ " + new Date().toString());
    await competitionDao.updateAwaitingCompetitionsToOngoing();
}

async function awardCompetitions(){ // spolupracuje s node-schedule - kazdu minutu pozrie, ze ktore sutaze treba odmenit - na zaklade casu



    try {

        //v tabulke najdi sutaze, kde je cas ukoncenia sutaze + tolerancia 1 min mensi ako aktualny cas a su v stave ongoing
        const compIdObjects = await competitionDao.getCompetitionIdsNowToBeAwarded();
        let competitionsWithWinners = [];

        console.log("awarding leaders:");


        for (const idObj of compIdObjects){

            //aktualizuj stav sutaze - ze sa prave ocenuje - stav AWARDING
            const res = await competitionDao.updateCompetitionStatus(idObj.competitionId, CompetitionStates.AWARDING.toString());

            if (res.affectedRows){

                //nacitaj cely objekt sutaze - waypointy + leaderboardy
                let cur_competition = await fetchCompetitionById(idObj.competitionId);

                // urci vitaza pre danu sutaz - ak nikto nedokoncil - vrat vyhru organizatorovi (competitor objekt)
                //const leader = findLeaderFromCompObj(cur_competition, 1, cur_competition.wayPointList.length);

                // if (leader != null){
                //     //zapis
                //     cur_competition.awardedAddr = leader.competitorEthAddress;
                // }
                // else {  //vrat naspat organizatorovi↓
                //     cur_competition.awardedAddr = cur_competition.organizerAddress; //ak nikto nedosiahol ciel / nevyhral
                // }
                //
                // competitionsWithWinners.push(cur_competition);

                //urci ranking
                let rankingList = await resolveFinalRanking(cur_competition); //pole objektov [meno (userId), cas (milisekundy)]
                //zapis ranking do db

                if (rankingList.length > 0){
                    //niekto prisiel do ciela

                    console.log(rankingList)
                    await updateDBRanking(rankingList,cur_competition.competitionId);
                    const leader = competitionHelper.getCompetitorByUserId(cur_competition.competitorsList, rankingList[0].userId);
                    cur_competition.awardedAddr = leader.competitorEthAddress;
                    cur_competition.awardedUserId = leader.userId;

                    //pridaj sutaz s vitazom do pola
                    competitionsWithWinners.push(cur_competition)

                }
                else {
                    //nikto neprisiel do ciela - vyhra vratena organizatorovi
                    cur_competition.awardedAddr = cur_competition.organizerAddress;
                    cur_competition.awardedUserId = cur_competition.organizerId;
                    competitionsWithWinners.push(cur_competition);
                }
            }
        }

        //mam zoznam sutazi, sutaze su uz aktualizovane na AWARDING stav, mam vyhercov, komu poslat vyhru ---> prevod

        for (let compToAward of competitionsWithWinners){

            sendAward(compToAward)
                .then(
                    () =>{
                    console.log("Awarded competition with id: " + compToAward);
                        });
        }

    }catch (error) {
        console.log(error);
    }

    //v kazdej zo sutazi vyhodnot vitaza - winner address


    //aktualizuj stavy tuchto sutazi ako AWARDING

}


// sekvencne cisla waypointov sutaze (napr. cas medzi prvym a tretim ... competitionId, 1, 3)
function findLeader(competitionId, startSeqNum, endSeqNum){



}


async function resolveFinalRanking(compObj){

    // pozri leaderboard konecneho WP
    let endWpLeaderboard = competitionHelper.getWpBySeqNum(compObj.wayPointList,1).leaderboard;
    let startLeaderboard = competitionHelper.getWpBySeqNum(compObj.wayPointList, compObj.wayPointList.length).leaderboard;

    if (!endWpLeaderboard.length){  //prazdne pole - vitaz = nikto
        return [];
    }

    let leadersMap = new Map();

    for (let record of endWpLeaderboard){
        // daj do mapy vysledne casy (milisekundy od 1970) sutaziacich v cielovom wp
        leadersMap.set(record.userId, record.arrivalTime.getTime());
    }

    for (let record of startLeaderboard){

        //kazdemu kto dosiel do ciela odcitaj startovny cas
        if (leadersMap.has(record.userId)){

            const subtractedTime = leadersMap.get(record.userId) - record.arrivalTime.getTime();
            leadersMap.set(record.userId, subtractedTime);
        }
    }

    //zorad mapu od najnizsieho casu po najvyssi (cas je cele cislo v milisekundach)

    const sortedMap = new Map([...leadersMap.entries()].sort((a,b) => a[1] - b[1]));
    return [...sortedMap].map(([userId, time]) => ({userId, time}));
}

async function updateDBRanking(rankedCompetitorsList, competitionId) {    //list {usedId, time} ordered by time in millis

    //aktualizuj DB - competitorId + rank

    for (let i = 0; i < rankedCompetitorsList.length; i++) {

        const sqlTime = timehelper.msToTime(rankedCompetitorsList[i].time); //milisekundy na mysql time format

        await competitionDao
            .updateCompetitorRanking(competitionId, rankedCompetitorsList[i].userId, sqlTime, (i + 1));
    }
}

function findLeaderFromCompObj(compObj, startSeqNum, endSeqNum){

    //pozri prvy a posledny waypoint
    let endWp = competitionHelper.getWpBySeqNum(compObj.wayPointList, endSeqNum);
    let startWp = competitionHelper.getWpBySeqNum(compObj.wayPointList, startSeqNum);

    // pozri leaderboard konecneho WP
    let endWpLeaderboard = endWp.leaderboard;
    let startLeaderboard = startWp.leaderboard;

    if (!endWpLeaderboard.length){  //prazdne pole - vitaz = nikto
        return null;
    }

    if (endWpLeaderboard.length === 1){
        //iba jeden sutaziaci dosiel do ciela = automaticky je vitaz
        return competitionHelper.getCompetitorByUserId(compObj.competitorsList ,endWpLeaderboard[0].userId);
    }

    //viac ucastnikov v cieli - vytvor casy

    let leadersMap = new Map();

    for (let record of endWpLeaderboard){
        // daj do mapy vysledne casy (milisekundy od 1970) sutaziacich v cielovom wp
        leadersMap.set(record.userId, record.arrivalTime.getTime());
    }

    for (let record of startLeaderboard){

        //kazdemu kto dosiel do ciela odcitaj startovny cas
        if (leadersMap.has(record.userId)){

            const subtractedTime = leadersMap.get(record.userId) - record.arrivalTime.getTime();
            leadersMap.set(record.userId, subtractedTime);
        }
    }

    //zorad mapu od najnizsieho casu po najvyssi (cas je cele cislo v milisekundach)

    const sortedMap = new Map([...leadersMap.entries()].sort((a,b) => a[1] - b[1]));

    return competitionHelper.getCompetitorByUserId(sortedMap.keys().next().value);    //vraciam objekt competitor na zaklade zosortovanej mapy (userId)
}


async function sendAward(competitionWithWinner){    //pozor - awardedAddr ak je rovnake ako organizerAddress - navrat vyhry organizatorovi

    //poposielaj vyhry
    const nftId = competitionWithWinner.nftId;
    const awardedAddress = competitionWithWinner.awardedAddr;


    console.log("nftid: " + nftId);
    console.log("aw addr: " + awardedAddress);


    //uncoment↓
    performTransfer({tokenId: competitionWithWinner.nftId, recipientAddress: awardedAddress})
        .then(async statusOk => {

            if (statusOk) {
                // transakcia presla - status (bollean true)
                competitionWithWinner.status = CompetitionStates.FINALIZED;
                await competitionDao.updateCompetitionStatusOnPrizeTransfered(nftId, CompetitionStates.FINALIZED);
                await notifyOnAwarded(competitionWithWinner);

            } else {
                // status je false alebo chytil vynimku
                await notifyOnAwarded(competitionWithWinner);
                await competitionDao.updateCompetitionStatusOnPrizeTransfered(nftId, CompetitionStates.PROBLEM);
            }

        });
}


async function notifyOnAwarded(competition){


    if (competition.status === CompetitionStates.FINALIZED){

        //pripad uspesneho prevodu - notifikacia

        const title = "Nft from competition received!"
        const text = "Competition name: " + competition.name+"\n"
            +"Your reward NFT name: " + competition.nftName + "\n "
            + "@Address: " + competition.awardedAddr+ "\n";

        await competitionDao.insertNotifOnPrizeTransfered(competition.awardedUserId, title,text);
    }
    else if (competition.status === CompetitionStates.PROBLEM){

        //pripad neuspesneho prevodu - notifikacia

        const title = "Problem with NFT transfer!"
        const text = "Competition name: " + competition.name+"\n"
            +"Your reward NFT name: " + competition.nftName + "\n "
            + "@Address: " + competition.awardedAddr + "\n" +
            "Ask support for nftId: " + competition.nftId + "\n";


        await competitionDao.insertNotifOnPrizeTransfered(competition.awardedUserId, title,text);

    }else {

        //default
    }
}



async function getBasicFinishedCompetitionsByUser({userId, pageNum,itemsPerPage}, callback){


    try {

        if ((userId === undefined) || pageNum === undefined
            || !Number.isInteger(Number(pageNum)) || itemsPerPage === undefined || !Number.isInteger(Number(itemsPerPage))
        ){

            return callback(new ValidationError("Invalid inputs!"))
        }

        const offset = dbHelper.getOffset(pageNum, itemsPerPage);

        const allComps = await competitionDao.countFinishedCompetitionsByUser(userId);
        console.log(allComps)
        const res = await competitionDao.getUsersFinishedBasicCompetitions(userId, itemsPerPage, offset);
        console.log(res)
        return callback(null, {
            competitions: res,
            pageNum: pageNum,
            allComps: allComps.numFinalized,
            allPages: dbHelper.getTotalPages(allComps.numFinalized, itemsPerPage)
        });

    }catch (error){
        console.log(error)
        return callback(error);
    }
}


module.exports = {registerCompetition, competitionsByMunicipality, addCompetitor, leaveOngoingCompetition,
    removeCompetitor, removeCompetition, getCompetitionById, transferNft, updateCompetitorOnStart, updateLeaderBoard, makeCompetitionsOngoing,
    getWaypointById, getNextWaypoint, getUserCompetitionsByUserId, getBasicFinishedCompetitionsByUser,
    awardCompetitions
}