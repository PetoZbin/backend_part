const tokenController = require("../controllers/tokens.controller");

const express = require("express");
const router = express.Router();

router.get("/:nftId/metadata", tokenController.getNFTMetadata);   //get metadata of nft by tokenId
router.get("/:address/nfts", tokenController.getNftsByAddress);  // upload metadat pre token

router.post("/metadata/save", tokenController.saveMetadata);  // upload metadat pre token


module.exports = router;