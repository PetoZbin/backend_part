
//const BASE_URL = "http://localhost:4000";      //moj server
const BASE_URL = "http://167.71.3.36"
//const CONTRACT_ADDRESS = "0x3252a61658Ac6CAC68eBE6EDDFE2cf92234c0795";  //erc721 first
const CONTRACT_ADDRESS = "0x696cF7705AE83936875E257C469AF6c305346112";  //erc721 aktualny
//const {CONTRACT_ABI} = require("../ABIs/erc721_at241")

const loadingAnim = $('#loading-wheel');
const loadingDiv = $('#loading-anim');
const nftDeck = $('#dash-card-div');
const nftDiv = $('#app');


//transfer tokenu na adresu podpis s metamask
async function transferNft(tokenId, recipientAddress) {

    console.log("transfer token with id: " + tokenId);
    console.log("recipient address: " + recipientAddress);


    let web3;

    if (window.ethereum) {

        const loggedAddress = localStorage.getItem("loggedEthAddress");

        if ((loggedAddress === undefined) || (loggedAddress === null)) {    // nespravne prihlasenie
            return -1;
        }

        web3 = new Web3(window.ethereum);
        console.log("have metamask");
        await ethereum.enable();    //uzivatel povoli pristup k metamask a pyta ucet

        const account = await web3.eth.getAccounts();       // akurat prihlasene ucty
        console.log(CONTRACT_ABI);

        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        contract.methods.performTransfer(tokenId, recipientAddress).send({
            from: account[0],   //musi byt vlastnikom nft
            value: 0
        })//value - hodnota eth, ktoru posielame funkcii - keby mint nieco stal, dam tam hodnotu
            .on("receipt", function (receipt) {  // pocka na vykonanie, posle uzivatelovi notice
                //uz previedol

                $('#transferModal').modal('hide');  //skry modal okno ak sa podaril transfer
                refreshNFTs();
            });

    }

}

//podpis s metamask
//pri burn dochadza na odoslanie tokenu na adresu, ku ktorej nikto nema pristup - 0 adresa
async function burnNFT(tokenId) {

    let web3;

    if (window.ethereum) {

        const loggedAddress = localStorage.getItem("loggedEthAddress");

        if ((loggedAddress === undefined) || (loggedAddress === null)) {    // nespravne prihlasenie
            return -1;
        }

        web3 = new Web3(window.ethereum);
        await ethereum.enable();    //uzivatel povoli pristup k metamask a pyta ucet

        const account = await web3.eth.getAccounts();       // akurat prihlasene ucty
        console.log(account);

        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        contract.methods.burn(tokenId).send({
            from: account[0],   //musi byt vlastnikom nft
            value: 0
        })//value - hodnota eth, ktoru posielame funkcii - keby mint nieco stal, dam tam hodnotu
            .on("receipt", function (receipt) {  // pocka na vykonanie mintu, posle uzivatelovi notice
                //vykonane
                $('#approveModal').modal('hide');  //skry modal okno ak sa podaril transfer
                refreshNFTs();
            });

    }

}



async function getOwnerData(){
    let current_user = Moralis.User.current();

    if (!current_user){

        current_user = await Moralis.Web3.authenticate();
    }

    let accounts = current_user.get("accounts");
    console.log(accounts[0]);

    const options = {chain: CHAIN, address: accounts[0], token_address: CONTRACT_ADDRESS};  //v mojom pripade ma 1 user 1 adresu

    return Moralis.Web3API.account.getNFTsForContract(options).then(

        (data) => {
            let result = data.result.reduce(
                (object, current_element) => {
                    console.log("token id: " + current_element.token_id);
                    object[current_element.token_id] = current_element.amount;
                    return object;
                }, {}
            )
            console.log(result);
            return result
        })

}

function fetchNftMetadata(userId){

    var metaPromises = [];

    //for(let i =0; i< nftArray.length; i++) {        //ku kazdemu nft tokenu potrebujem metadata, aby som zobrazil jeho informacie

       // $.ajax({
       //      type: 'GET',
       //      url: BASE_URL + '/tokens/' + nftArray[i].token_id + '/metadata',
       //      crossDomain: true,
       //      contentType: "application/json",
       //      accepts: {
       //          text: "application/json"
       //      },
       //      success: function (result) {
       //
       //          //console.log("data success ");
       //
       //          if (result.data !== undefined) {
       //              //metadataArray.push(result.data.metadata);
       //              drawNfts(result.data);
       //          }
       //      },
       //      //complete: function (jqXHR, textStatus) {
       //      //},
       //      error: function (req, status, error) {
       //
       //          //todo ERROR handling - messages
       //          console.log(error + " from server");
       //      }
       //  });
        //}

        //drawNfts(result);
        //metadataArray.push(result);

    console.log(userId)

        $.ajax({
             type: 'GET',
            // url: BASE_URL + '/users/' + userId + '/user-nfts',
            url: BASE_URL + '/tokens/' + localStorage.getItem('loggedEthAddress')  +'/nfts',
             crossDomain: true,
             contentType: "application/json",
             accepts: {
                 text: "application/json"
             },
             success: function (result) {
                 if (result.data !== undefined) {
                     //metadataArray.push(result.data.metadata);
                     for(const elem of result.data){
                         console.log(elem)
                         drawNft(elem);
                     }

                     nftDeck.removeClass('d-none');

                 }
             },
             //complete: function (jqXHR, textStatus) {
             //},
             error: function (req, status, error) {

                 console.log(error + " from server");
             }
         });
}


function getUserTokens(userId){

    let result;

    $.ajax({
        type: 'GET',
        url: BASE_URL + '/users/' + userId + '/user-nfts',
        crossDomain:true,
        contentType: "application/json",
        accepts: {
            text: "application/json"
        },
        success: function (res) {
            result = res;
        },
        error: function (req, status, error) {

            console.log(error + " from server");
        },
        async: false
    });

    return result;
}

function drawNft(res_metadata){   // pole s metadatami


    const parent = document.getElementById("app");       //doplnam karty nftciek pre uzivatela - div s id app - je to row, kde davam colomns

        if(res_metadata === undefined || res_metadata === null){
            return;
        }

        const metadata =  prepareMetadata(res_metadata);

        console.log(metadata);

        let htmlString = `
                           
                                
                        <div class="card">
                        
                            <div class="card-header dash-header align-items-center justify-content-center"  style="width: 100%; height: 10vw;  object-fit: cover;">
                            
                                <img class="card-img-top" src="${metadata.image}"
                                style="width: 100%; max-height: 10vw;  object-fit: cover;" alt="Card image">
                            
                            </div>

                            <div class="card-body d-flex flex-column dash-body">
                                <h5 class="card-title">${metadata.name}</h5>
                                <p class="card-text mb-4">${metadata.description}</p>
                            </div>
                            
                                <div class="card-footer mt-auto text-center dash-footer" style="width: 100%">
                                
                                    <div class="btn-group dash-btn-group" role="group">
                                        <button id="btnGroupDrop1" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                          Actions
                                        </button>
                                        <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
                                          <a class="dropdown-item" data-toggle="modal" data-target="#transferModal" data-nftid=${metadata.token_id} href="#">Transfer</a>
                                          <a class="dropdown-item" data-toggle="modal" data-target="#approveModal" data-nftid=${metadata.token_id} href="#">Burn</a>
                                          
                                        </div>
                                    </div>
                                
                                </div>
                                
                             </div>
                             
                            
                        
                    </div>
                  `;
        let column = document.createElement("div");
        column.className = "col-lg-3 mb-3 d-flex align-items-stretch";
        column.innerHTML = htmlString;
        parent.appendChild(column);
}

function prepareMetadata(metadata){     //function for getting metadata to correct form (if not consistent)

    let correct_metadata = {
        name : "no name NFT",
        description: "no description",
        image: "img/no_cross.png",
        token_id: metadata.token_id,
        token_address: metadata.token_address
    }

    if(metadata.name !== ""){
        correct_metadata.name = metadata.name;
    }

    if(metadata.description !== ""){
        correct_metadata.description = metadata.description;
    }

    if(typeof metadata.image == 'string' || (metadata.image instanceof String)){

        if(metadata.image !== ""){
            correct_metadata.image = metadata.image;
        }

    }
    else{

        if(metadata.image.url !== undefined){
            correct_metadata.image = metadata.image.url;
        }
    }



    return correct_metadata;
}




async function initApp(){       //on sign in button

    current_user = Moralis.User.current();

    if (!current_user){

        current_user = await Moralis.Web3.authenticate();
    }


    //zadavam adresu smart kontraktu a nasledovne chain, kde sa nachadza - vsetky tokeny pre uzivatela natiahne
    const options = {address: CONTRACT_ADDRESS, chain: "mumbai"};
    let NFTs = await Moralis.Web3API.token.getAllTokenIds(options);
    // console.log(NFTs);
    let ownerData = await getOwnerData();
    //let NFTswithMetadata = await fetchNftMetadata(NFTs.result);     // stiahnem si metadata nft pre lognuteho uzivatela
    //console.log(NFTswithMetadata);

    console.log(ownerData);
    // drawUserNfts(NFTswithMetadata, ownerData);

}



async function init(){


    if((localStorage.getItem("loggedUserId") === null || (localStorage.getItem("loggedEthAddress") === null))
            || (localStorage.getItem('loggedUser') === null)
                    || localStorage.getItem("loggedUserId") === null){

        window.location = BASE_URL + "/login";  // znovu sa prihlas - v local storage chybaju udaje
    }

    $('.username_span').text(localStorage.getItem('loggedUser'));

    //displayUserNfts(localStorage.getItem("loggedUserId"));


    //$('.dash-card-div').hide();
    refreshNFTs();  // dotiahnutie a zobrazenie NFT uzivatela TODO: odkomentuj
}

function refreshNFTs(){

   // let userTokens = getUserTokens(localStorage.getItem("user-nfts"));    //synchronne dotiahnutie tokenov

    // if(userTokens === undefined){
    //     console.log("No logged user");
    //     window.location = BASE_URL + "/login";
    //     return;
    // }

    //console.log(userTokens);  uz je inym sposobom

    //fetch a vykreslovanie nftcok

    nftDeck.addClass('d-none');
    nftDeck.removeClass("d-flex");
    nftDiv.empty();

    if ((localStorage.getItem("loggedUserId") !== undefined) && (localStorage.getItem("loggedUserId") !== null)){
        fetchNftMetadata(localStorage.getItem("loggedUserId"));
    }
    else{
        window.location = BASE_URL + "/login";
    }




}

const refresh_btn = $('#own-refresh-btn');

refresh_btn.click(refreshNFTs);


//$('#loading-anim').addClass('d-none');  // bootstrap schvanie


loadingAnim.addClass('d-none');  // bootstrap schovanie prvku
loadingDiv.addClass('d-none');
nftDeck.addClass('d-none');

$(document)
    .ajaxStart(function(){
        console.log("ajaxstart")
        loadingAnim.removeClass('d-none');
        loadingDiv.addClass("d-flex").removeClass('d-none');
    })
    .ajaxStop(function(){
        console.log("ajaxStop")
        loadingAnim.removeClass("d-flex").addClass('d-none');
        loadingDiv.removeClass("d-flex").addClass('d-none');
    });



// zdroj:  bootstrap ukazka https://getbootstrap.com/docs/4.0/components/modal/#events
$('#transferModal').on('show.bs.modal', function (event) {
    console.log("modal")
    var button = $(event.relatedTarget)
    var nftId = button.data('nftid')
    var recipient = $('#recipient-address').val();
    var modal = $(this)
    modal.find('.modal-title').text('Do you wish to transfer NFT with ID: ' + nftId + '?')

    const transferBtn = $('#transferSubmitBtn');
    transferBtn.click(function(){
        transferNft(nftId, $('#recipient-address').val().trim());
    });

    //modal.find('.modal-body input').val(nftId)
})


$('#approveModal').on('show.bs.modal', function (event) {
    console.log("approve modal")
    var button = $(event.relatedTarget);
    var nftId = button.data('nftid')
    var modal = $(this)
    modal.find('.modal-title').text('Do you wish to burn NFT with ID: ' + nftId + '?')

    const submitBtn = $('#burnSubmitBtn');
    submitBtn.click(function(){
        burnNFT(nftId);
    });
})

init();
