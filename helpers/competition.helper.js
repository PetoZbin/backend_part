

function getWpBySeqNum(waypointList, seqNum){

    for (let wp of waypointList){

        if (wp.seqNumber.toString() === seqNum.toString()){

            return wp;
        }
    }
    return null;
}

function getCompetitorByUserId(competitorList, userId){

    for (let competitor of competitorList){

        if (competitor.userId === userId){
            return competitor;
        }
    }
    return null;
}

module.exports = {getWpBySeqNum,getCompetitorByUserId}