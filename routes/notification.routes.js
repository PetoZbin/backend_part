const notifController = require("../controllers/notification.controller");
const express = require("express");
const router = express.Router();

router.get("/user/:userId", notifController.getUserNotifs);  // vrati sutaze na zaklade lokality(mesto, okres)

module.exports = router;