const competitionController = require("../controllers/competition.controller");
const express = require("express");
const tokenController = require("../controllers/tokens.controller");
const router = express.Router();

router.post("/register", competitionController.registerCompetition);  // register new competition
router.post("/competitor/add", competitionController.addCompetitor);  // add competitor to competition
router.put("/competitor/atStart", competitionController.updateCompetitorOnStart);   // confirm competitor at start + add to leaderboard
router.put("/:competitionId/competitor/:competitorId/leave", competitionController.leaveOngoingCompetition); //ucastnikovi sa zachova pravo znovu vstupit
router.post("/competitor/updateLeaderboard", competitionController.updateLeaderBoard);    //on waypoint reached


router.get("/local/:municipalities/", competitionController.competitionsByMunicipality);  // vrati sutaze na zaklade lokality(mesto, okres)
router.get("/:competitionId/", competitionController.getCompetitionById);
router.get("/userCompetition/:userId/", competitionController.getUserCompetitionsByUserId);
router.get("/transferNft/:tokenId/recipient/:recipientAddress/", competitionController.transferNft);
router.get("/waypoint/:waypointId/", competitionController.getWaypointById);
router.get("/:competitionId/waypoint/:waypointId/next", competitionController.getNextWaypoint);
router.get("/finished/user/:userId/:page/:maxItems", competitionController.getBasicFinishedCompetitionsByUser);

router.delete("/:competitionId/competitor/:competitorId/giveup", competitionController.removeCompetitor);  // zmazanie ucastnika zo sutaze
router.delete("/:competitionId/owner/:competitorId/revoke", competitionController.removeCompetition);  // zmazanie celej sutaze ownerom

module.exports = router;