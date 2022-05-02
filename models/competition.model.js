const mongoose = require("mongoose");
const {Schema} = mongoose;
const uniqueValidator = require("mongoose-unique-validator");
const userValidators = require("../validators/user_validators");



const competitorSchema = new Schema({

    competitorId: {
        type: String,       //userId
        required: true,
    },
    competitorName: {
        type: String,       //userName
        required: true,
    },
    competitorEthAddress: {
        type: String,       //adresa kde v pripade vyhry vyplatit nft
        required: true,
    },
    confirmed: {
        type: Boolean,
        required: false,
        default: false
    },
    status: {
        type: String,       //adresa kde v pripade vyhry vyplatit nft
        required: true,
        default: 'SPECTATOR',
    }

});

const leaderSchema = new Schema({
    competitorId: {
        type: String,
        required: true,
    },
    arrivalTime: {      //timestamp
        type: Date,
        required: true,
    },
    standing: {     //poradie v rebricku
        type: Number,
        required: true
    },
});

const waypointsSchema = new Schema({

    lat: {
        type: String,
        required: true,
    },
    lng: {
        type: String,
        required: true,
    },
    thoroughfare: {     //popis miesta
        type: String
    },
    seqNumber: {     //poradie checkpointu
        type: Number,
        required:true,
    },leaderboard: [leaderSchema],
    // leaderboard:{       // id ucastnika, poradove cislo, cas
    //
    // type: Array,
    // items: {
    //     type: "mongoose.Schema.Types.ObjectId",
    //     ref: "leader"
    // }
//}

});


const competitionSchema = new Schema({

    organizerId: {
        type: String,
        required: true,
        unique: false,
    },
    organizerAddress: {
        type: String,
        required: true,
        unique: false,
    },
    status: {
        type: String,
        unique: false,
        default: 'AWAITING'     //completed, ongoing
    },
    municipality: {     //uzemny celok (mesto) kde sa sutaz odohrava
        type: String,
        required: true,
        unique: false,
    },
    name: {     //nazov sutaze
        type: String,
        required: true,
        unique: false,
    },
    metaUrl: {
        type: String,
        required: true,
        unique: true,       //cena je vramci sutaze unikatna
    },
    nftId: {
        type: String,
        required: true,
        unique: true,       //implementacia na konkretny smart kontrakt, kde je unikatne id
    },
    nftName: {
        type: String,
        required: true,
    },
    compDateTime: {
        type: Date,
        required: true,
    },
    durationMins: {     //maximalny cas v minutach
        type: Number,
        required: true,
    },
    maxCompetitors: {     //maximalny pocet zucastnenych
        type: Number,
        required: true,
    },
    blockHash: {     //identifikator bloku, kde nastal transfer nft
        type: String,
        required: true,
    },
    wayPointList: // [waypointsSchema],
        {       //eth address usera sluzi na transakcie smerom k userovi

        type: Array,
        items: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "waypoint"
        }
    },
    competitorsList: [competitorSchema]
    //     {      //data ucastnikov - id, adresa
    //
    //     type: Array,
    //     items: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "competitor"
    //
    //     }
    // }

});






competitionSchema.set("toJSON", {

    transform: (document, returnObject) => {

        returnObject.id = returnObject._id.toString();
        delete returnObject._id;
        delete returnObject.__v; // value ktora defaultne prichadza z mongo DB
    }
});

//main document↓
const Competition = mongoose.model("competition", competitionSchema);

//subdocuments↓
const Leader = mongoose.model("leader", leaderSchema);
const Waypoint = mongoose.model("waypoint", waypointsSchema);
const Competitor = mongoose.model("competitor", competitorSchema);


module.exports = {Competition, Leader, Waypoint, Competitor};

