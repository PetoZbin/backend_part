const CompetitionStates = {
    AWAITING: "AWAITING",
    ONGOING: "ONGOING",
    AWARDING: "AWARDING",       // sutaz skoncila, prave prebieha dorucovanie NFT vyhry
    PROBLEM: "PROBLEM",
    FINALIZED: "FINALIZED",     //skoncena, vyhodnotena sutaz (udelena vyhra)
    CANCELED: "CANCELED"
};


module.exports = {CompetitionStates}