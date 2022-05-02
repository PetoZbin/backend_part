const userController = require("../controllers/user.controller");

const express = require("express");
const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/metamaskLogin", userController.metamaskLogin);
router.post("/addAddress", userController.addAddress);

router.get("/user-profile", userController.userProfile);
router.get("/:userId/user-nfts", userController.getUserNfts);   //get user's nfts

router.delete("/:userId/address/:address", userController.deleteUsersAddress);   //delete users address

module.exports = router;

