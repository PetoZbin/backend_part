//const Web3 = require("web3");
const BASE_URL = "http://localhost:4000";
const NODE_URL = "https://speedy-nodes-nyc.moralis.io/7e552ee0a5c1d070a33196ac/polygon/mumbai"; //cez sluzbu moralis speedy nodes
//const CONTRACT_ADDRESS = "0x3252a61658Ac6CAC68eBE6EDDFE2cf92234c0795";  //erc721 first
const CONTRACT_ADDRESS = "0x696cF7705AE83936875E257C469AF6c305346112";  //erc721 aktualny


const imgField = $('#input_img');
const nameField = $('#input_name');
const descField = $('#input_desc');
const mintBtn = $('#login_submit_btn')
//import{CONTRACT_ABI} from "../ABIs/erc721_first_ABI";


//tutorial pre pouzitie uzlov  https://www.youtube.com/watch?v=UJKSTSSXuPk&t=457s


imgField.change(show_preview);
mintBtn.click(mintNFT);



const loadingAnim = $('#loading-wheel');
const loadingDiv = $('#loading-anim-mint');

loadingDiv.addClass('d-none');

$(document)
    .ajaxStart(function(){
        console.log("ajaxstart")
        loadingDiv.addClass("d-inline").removeClass('d-none');
    })
    .ajaxStop(function(){
        console.log("ajaxStop")
        loadingDiv.removeClass("d-inline").addClass('d-none');
    });







async function mintNFT(){


    let name = nameField.val();
    let desc = descField.val();

    let metafactory = {

        name: name,
        desc: desc,
        imgFile: imgField.get(0)
    };

    // nacitanie a check polí
    if(!checkInputs(metafactory)){

        alert("Check the inputs");
        return;
    }

    metafactory = await prepareMetaFactory(metafactory);
    console.log(metafactory);
    //uploadni metadata na server v ipfs + pouzitie moralis gateway
    const metaUri = await uploadMetadata(metafactory);        //returns metadata uri, pouzije sa na namapovanie tokenu k metadatam

    mintToken(metaUri); // vymintuj token
}

function checkInputs(metafactory){

    if(!metafactory.imgFile || (metafactory.imgFile.files.length  === 0)  || !metafactory.imgFile.files[0]){    //file input empty
        console.log("empty file field!")
        return false;
    }

    if((metafactory.name === "") || (metafactory.name.length === 0)){
        console.log("empty name field!")
        return false;
    }

    if((metafactory.desc === "") || (metafactory.desc.length === 0)){
        console.log("empty description field!")
        return false;
    }

    return true;
}


function convert2Base64(imgFile){       //do jasonu posielam subor vo formate base64

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imgFile);

        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function prepareMetaFactory(metafactory){

    const base64Img = await convert2Base64(metafactory.imgFile.files[0]);
    metafactory.name = metafactory.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");    //nech sa neda script injection
    metafactory.desc = metafactory.desc.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    metafactory.imgFile = base64Img;

    return metafactory;
}

function uploadMetadata(metafactory){       //metafactory name, desc, picture

    let metaUri;

    $.ajax({
        type: 'POST',
        url: BASE_URL + '/tokens/metadata/save',
        crossDomain: true,
        data: JSON.stringify(metafactory),
        contentType: "application/json",
        async: false,
        accepts: {
            text: "application/json"
        },
        success: function (result) {

            const res = JSON.parse(result)
            metaUri = res.data.uri;
        },
        //complete: function (jqXHR, textStatus) {
        //},
        error: function (req, status, error) {

            //todo ERROR handling - messages
            console.log(error.message + " from server");
        }
    });

    return  metaUri;
}


function show_preview(){    // funkcia ukaze preview obrazka, ktory chcem ulozit

    if(imgField.get(0) && imgField.get(0).files[0]){

        var reader = new FileReader();

        reader.onload = function(event){

            $('#imageResult').attr('src', event.target.result);  //.src = URL.createObjectURL(imgField.result);
        };

        reader.readAsDataURL(imgField.get(0).files[0]);
    }
    else {
        //vymaz obsah z pola a preview
        $('#imageResult').attr('src', "")
        imgField.val("");
    }
}

async function mintToken(uri) {       //interakcia s penazenkou a smart kontraktom, vstupny parameter uri na metadata

    // navod: https://www.quicknode.com/guides/web3-sdks/how-to-connect-to-ethereum-network-with-web3-js
   // var provider = new Web3.providers.HttpProvider(NODE_URL);
    //var web3 = new Web3(provider);

    //spusti loading wheel
    loadingDiv.addClass("d-inline").removeClass('d-none');loadingDiv.addClass("d-inline").removeClass('d-none');

    let web3;
    if (window.ethereum) {

        const loggedAddress = localStorage.getItem("loggedEthAddress");

        if((loggedAddress  === undefined) || (loggedAddress  === null)){    // nespravne prihlasenie
            return -1;
        }

        web3 = new Web3(window.ethereum);
        console.log("have metamask");
        await ethereum.enable();    //uzivatel povoli pristup k metamask a pyta ucet




        const account = await web3.eth.getAccounts();       // akurat prihlasene ucty

        console.log(account);
        console.log(uri);

        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        //mintuj token na adresu prihlaseneho uzivatela pomocou adresy prihlasenej v metamask - v tejto implementacii sa nemusia zhodovat
        contract.methods.mint(loggedAddress, uri).send({from: account[0], value: 0})//value - hodnota eth, ktoru posielame funkcii - keby mint nieco stal, dam tam hodnotu
            .on("receipt", function (receipt){  // pocka na vykonanie mintu, posle uzivatelovi notice
                //schovaj loading
                loadingDiv.removeClass("d-inline").addClass('d-none');
                clearFields();
                alert("Mint done");
            });

    }

    function clearFields(){

         imgField.val('');
         nameField.val('');
         descField.val('');
        $('#imageResult').attr('src', "");
    }

    // if (web3.currentProvider.isMetamask === true){
    //
    //     console.log("metamask active");
    // }
    // else{
    //
    //     console.log("metamask not active");
    // }
    // //vytvor web3 smartkontrakt


}
