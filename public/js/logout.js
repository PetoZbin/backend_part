
//const BASE_URL = "http://localhost:4000";
const logoutBtn = $("#logout_btn");



function logUserOut() {

    localStorage.removeItem("nftLoggedToken");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("loggedUserId");
    localStorage.removeItem("loggedEthAddress");

    window.location = BASE_URL + "/";
}


logoutBtn.click(logUserOut);