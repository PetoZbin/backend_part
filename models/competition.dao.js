const db = require("../db/db");
const {emptyOrRows,getOffset} = require("../db/db.helper");
const {CompetitionStates} = require("../enums/competitionStates");
const {CompetitorStates} = require("../enums/competitorStates");
const timeHelper = require("../helpers/time.helper")
const {TIME} = require("mysql/lib/protocol/constants/types");

const TIMEZONE_OFFSET = 2;

async function insertCompetition(competition){

    const sql = `INSERT INTO competitions (organizerId, organizerAddress, name, municipality, metaUrl, nftId, nftName,
       compDateTime, durationMins, maxCompetitors, blockHash) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

    return await db.query(sql, [competition.organizerId, competition.organizerAddress, competition.name, competition.municipality,
    competition.metaUrl, competition.nftId, competition.nftName ,competition.compDateTime, competition.durationMins, competition.maxCompetitors,
    competition.blockHash]);

}

async function insertWaypoints(waypointList, competitionId){

    const sql = `INSERT INTO waypoints (competitionId , lat, lng, thoroughfare, seqNumber, isStart, isFinish) VALUES ?`;
    //console.log(waypointList)

    //pre bulk vkladanie treba 2D pole
    return await db.query(sql, [waypointList], true);
}

// async function insertUserCompetition(userId, competitionId){ //spojovacia tabulka - n:n ... uzivatel:sutaz
//
//     const sql = `INSERT INTO user_competition (userId , competitionId) VALUES (?,?)`;
//
//     return await db.query(sql,[userId, competitionId]);
// }


async function insertCompetitor(userCompetition){

    const sql = `INSERT INTO competitors (userId , competitionId, competitorEthAddress, active, competitorStatus) VALUES(?,?,?,?,?)`;

    return await db.query(sql,[userCompetition.competitorId, userCompetition.competitionId, userCompetition.competitorEthAddress,
     userCompetition.active, CompetitorStates.JOINED]);
}

async function insertCheckpointEntry(userId, waypointId, arrivalTime){ // zapis do tabulky leaderboard - cas uzivatela

    const sql = `INSERT INTO leaderboard (waypointId, userId, arrivalTime) VALUES (?,?,?)`;

    return await db.query(sql, [waypointId, userId, arrivalTime]);

}

async function insertNotifOnPrizeTransfered(userId, notifHeading ,notifText){

    const sql = `INSERT INTO notifs (userId , notifHeading, notifText) VALUES (?,?,?)`;

    return await db.query(sql, [userId, notifHeading, notifText]);

}

async function updateAwaitingCompetitionsToOngoing(){
//NOW()

    const sql = `UPDATE competitions SET status = 'ONGOING' WHERE status = 'AWAITING' AND compDateTime < ?`;
    return await db.query(sql, [timeHelper.getMySqlTime(TIMEZONE_OFFSET)]);



}


async function updateStatusOnUserGaveUp(competitorId, competitionId){    // vzdanie sa v priebehu sutaze

    const sql = `UPDATE competitors SET competitorStatus = 'JOINED' WHERE userId = ? AND competitionId = ?`;
    return await db.query(sql, [competitorId, competitionId]);
}



async function updateOnMultiplePerformingCompetitions(userId){    // vsetky aktualne sutaze uzivatela prejdu zo stavu performing do JOINED
    //PERFORMING MOZE byt len jedna sutaz v case

    const sql = `UPDATE competitors SET competitorStatus = 'JOINED', active = '0' WHERE userId = ? AND competitorStatus = 'PERFORMING'`;
    return await db.query(sql, [userId]);
}


async function updateStatusOnNewStart(userId, competitionId){    // vsetky aktualne sutaze uzivatela prejdu zo stavu performing do JOINED
    //PERFORMING MOZE byt len jedna sutaz v case

    const sql = `UPDATE competitors SET competitorStatus = 'PERFORMING', active = '1' WHERE userId = ? AND competitionId = ? AND competitorStatus = 'JOINED'`;
    return await db.query(sql, [userId, competitionId]);
}

async function updateCompetitionStatus(competitionId, status){

    const sql = `UPDATE competitions SET status = ? WHERE competitionId = ?`;
    return await db.query(sql, [status, competitionId]);

}


async function updateCompetitorRanking(competitionId, userId, totaTime, rankNum){

    const sql = `UPDATE competitors SET totalTime = ?, totalRank = ? WHERE competitionId = ? AND userId = ?`;
    return await db.query(sql, [totaTime, rankNum, competitionId, userId]);

}



// zavola sa na on receipt po transakcii (bud status problem alebo status FINALIZED)
async function updateCompetitionStatusOnPrizeTransfered(nftId, status){

    const sql = `UPDATE competitions SET status = ? WHERE nftId = ? AND status = 'AWARDING'`;
    return await db.query(sql, [status, nftId]);

}



async function getWaypointById(waypointId){

    const sql = `SELECT * FROM waypoints WHERE waypointId = ? LIMIT 1`;

    const res = await db.query(sql, [waypointId]);
    const data = emptyOrRows(res);
    return data[0];

}

async function getWaypointsByCompetitionId(competitionId){

    const sql = `SELECT * FROM waypoints WHERE competitionId = ? ORDER BY seqNumber ASC`;

    const res = await db.query(sql, [competitionId]);
    const data = emptyOrRows(res);
    return data;
}

async function getWaypointsAlreadyPassed(competitionId, userId){     //waypointy, kde ucastnik ma zaznam o case pre danu sutaz

    const sql = `SELECT waypoints.*, leaderBoard.recordId AS recordId, leaderBoard.userId, leaderboard.arrivalTime
       FROM waypoints INNER JOIN leaderboard ON waypoints.waypointId = leaderboard.waypointId
        WHERE waypoints.competitionId = ? AND leaderboard.userId = ? ORDER BY seqNumber ASC`;

    const res = await db.query(sql, [competitionId, userId]);
    const data = emptyOrRows(res);
    return data;

}


async function getCompetitorsByCompetitionId(competitionId){

    const sql = `SELECT competitors.*, users.username FROM competitors INNER JOIN users ON competitors.userId = users.userId
WHERE competitionId = ? ORDER BY users.username ASC`;

    const res = await db.query(sql, [competitionId]);
    const data = emptyOrRows(res);
    return data;
}

async function getNextWaypoint(competitionId, waypointId){

    const sql = `SELECT * FROM waypoints 
        WHERE seqNumber = ((SELECT seqNumber FROM waypoints WHERE waypointId = ? LIMIT 1) +1) AND competitionId = ? LIMIT 1`;

    const res = await db.query(sql, [waypointId, competitionId]);
    const data = emptyOrRows(res);
    return data;
}

async function getWaypointByCompetitionAndSeqNum(competitionId, seqNum){    //seqNum = poradie waypointuv sutazi -> 1,...,n

    const sql = `SELECT * FROM waypoints WHERE competitionId = ? AND seqNumber = ? LIMIT 1`;

    const res = await db.query(sql, [competitionId, seqNum]);
    const data = emptyOrRows(res);
    return data;
}

async function getCompetitionById(competitionId){

    const sql = `SELECT * FROM competitions WHERE competitionId = ? LIMIT 1`;

    const res = await db.query(sql, [competitionId]);
    const data = emptyOrRows(res);
    return data[0];
}

async function getCompetitionByPrizeNftId(nftId, status){

    const sql = `SELECT * FROM competitions WHERE nftId = ? AND status = ? LIMIT 1`;

    const res = await db.query(sql, [nftId, status]);
    const data = emptyOrRows(res);
    return data[0];

}

async function getLeaderBoardByWaypointId(waypointId){

    const sql = `SELECT leaderboard.*, users.username FROM leaderboard INNER JOIN users ON leaderboard.userId = users.userId WHERE waypointId = ?
        ORDER BY arrivalTime ASC`;

    const res = await db.query(sql, [waypointId]);
    const data = emptyOrRows(res);
    return data;
}

async function getCompetitionIdsByMunicipalities(municipalitiesArray){ //vstup je pole 2 stringov napr Ilava, Trencin

    let sql = `SELECT competitionId FROM competitions WHERE `;

    for (let i=0; i<municipalitiesArray.length; i++){

        if (i !== 0){

            sql = sql + " OR "
        }

        sql = sql + " municipality = ? "
    }


    const res = await db.query(sql, municipalitiesArray);
    const data = emptyOrRows(res);
    return data;
}

async function getUserCompetitionsByUserId(userId){   //spojovacie tabulky sutaz-sutaziaci -> aktualizacia internej mobilnej DB

    const sql = `SELECT * FROM competitors WHERE userId = ?`;

    const res = await db.query(sql, [userId]);
    const data = emptyOrRows(res);
    return data;

}

async function getLeaderBoardByUserInCompetition(userId, competitionId){

    const sql = `SELECT * FROM leaderboard WHERE`

}


async function getCompetitionIdsNowToBeAwarded(){

    //NOW()

    const sql = `SELECT competitionId FROM competitions WHERE (DATE_ADD(compDateTime, INTERVAL durationMins minute) < ?) AND (status = 'ONGOING')`

    const res = await db.query(sql, [timeHelper.getMySqlTime(TIMEZONE_OFFSET)]);
    const data = emptyOrRows(res);
    console.log(data);
    return data;
}


async function getUsersFinishedBasicCompetitions(userId,pageLimit, offset,
                                                 competitionStatus = CompetitionStates.FINALIZED,
                                                 competitorStatus = CompetitorStates.FINISHED){

    const paging = "LIMIT"+ " " + pageLimit + " " + "OFFSET" + " " + offset;

    const sql = `SELECT competitions.competitionId, competitions.name, competitions.compDateTime, 
       competitions.maxCompetitors, competitors.userId,competitors.totalTime, competitors.totalRank,
        (SELECT COUNT(competitorId) FROM competitors WHERE competitions.competitionId = competitors.competitionId) as numCompetitors
        FROM competitions INNER JOIN competitors ON competitions.competitionId = competitors.competitionId 
        WHERE userId = ? AND competitions.status = ? AND competitors.competitorStatus = ? GROUP BY competitions.competitionId
        ORDER BY competitions.compDateTime `
    +" " + paging;


    const res = await db.query(sql, [userId, competitionStatus, competitorStatus]);
    const data = emptyOrRows(res);
    return data;

}

async function countFinishedCompetitionsByUser(userId, competitionStatus = CompetitionStates.FINALIZED,
                                               competitorStatus = CompetitorStates.FINISHED){

    const sql = `SELECT COUNT(competitions.competitionId) AS numFinalized FROM competitions INNER JOIN competitors ON competitions.competitionId = competitors.competitionId
                 WHERE userId = ? AND competitions.status = ? AND competitors.competitorStatus = ?`

    const res = await db.query(sql, [userId, competitionStatus, competitorStatus]);
    return res[0];
}


async function deleteCompetition(competitionId, organizerId){

    const sql = `DELETE FROM competitions WHERE competitionId = ? AND organizerId = ?`;

    return await db.query(sql, [competitionId, organizerId]);

}

async function deleteCompetitor(competitorId, competitionId){

    const sql = `DELETE FROM competitors WHERE userId = ? AND competitionId = ?`;
    return await db.query(sql, [competitorId, competitionId]);
}

async function deleteCompetitorsLeaderboard(competitorId, recordId){  // vymazanie konkretneho zaznamu sutaziaceho z leaderboardu

    const sql= `DELETE FROM leaderboard WHERE recordId = ? AND userId = ?`
    return await db.query(sql, [recordId, competitorId]);
}


async function checkUniquePrize(nftId){

    const sql = `SELECT EXISTS(SELECT nftId FROM competitions WHERE nftId = ? AND (status = ? OR status = ?)) AS 'exists'`

    const res = await db.query(sql, [nftId, CompetitionStates.AWAITING, CompetitionStates.ONGOING]);
    const data = emptyOrRows(res);

    return data[0];
}

async function checkAlreadyCompetes(competitorId, competitionId){   // ci sa uz nahodou pred tym neprihlasil do sutaze

    const sql = `SELECT EXISTS(SELECT competitorId FROM competitors WHERE userId = ? AND competitionId = ?) AS 'exists'`

    const res = await db.query(sql, [competitorId, competitionId]);
    const data = emptyOrRows(res);

    return data[0];
}

async function checkAlreadyInLeaderBoard(competitorId, waypointId){   // ci neposiela duplicitny udaj o dosiahnuti checkpointu

    const sql = `SELECT EXISTS(SELECT recordId FROM leaderboard WHERE userId = ? AND waypointId =?) AS 'exists'`

    const res = await db.query(sql, [competitorId, waypointId]);
    const data = emptyOrRows(res);

    return data[0];
}

module.exports = {insertCompetition, insertWaypoints,  insertCompetitor, insertCheckpointEntry, insertNotifOnPrizeTransfered,
    updateStatusOnNewStart , updateAwaitingCompetitionsToOngoing, updateCompetitionStatusOnPrizeTransfered,
    updateStatusOnUserGaveUp, updateOnMultiplePerformingCompetitions, updateCompetitionStatus, updateCompetitorRanking,
    getWaypointById, getUserCompetitionsByUserId,
    getWaypointsByCompetitionId, getWaypointByCompetitionAndSeqNum, getNextWaypoint, getCompetitionById, getCompetitionIdsNowToBeAwarded,
    getLeaderBoardByWaypointId, getCompetitorsByCompetitionId, getWaypointsAlreadyPassed, getCompetitionByPrizeNftId, getUsersFinishedBasicCompetitions,
    getCompetitionIdsByMunicipalities,deleteCompetitor, deleteCompetition, deleteCompetitorsLeaderboard,
    checkUniquePrize, checkAlreadyInLeaderBoard, checkAlreadyCompetes, countFinishedCompetitionsByUser}