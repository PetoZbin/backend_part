

//import ("./jquery/jquery-3.6.0.js");

const APP_ID = "rELbDT6WE5E0pRLST3xFPLm3VJCY0NPyoAsZKDS0";
const SERVER_URL = "https://qoosg0bvpmho.usemoralis.com:2053/server"
const CONTRACT_ADDRESS = "0xEF2F23b6936F18249777df894544EDEf9d7145aF"
const CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "ApprovalForAll",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256[]",
                "name": "ids",
                "type": "uint256[]"
            },
            {
                "indexed": false,
                "internalType": "uint256[]",
                "name": "values",
                "type": "uint256[]"
            }
        ],
        "name": "TransferBatch",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "TransferSingle",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string",
                "name": "value",
                "type": "string"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "URI",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "accounts",
                "type": "address[]"
            },
            {
                "internalType": "uint256[]",
                "name": "ids",
                "type": "uint256[]"
            }
        ],
        "name": "balanceOfBatch",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            }
        ],
        "name": "isApprovedForAll",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "reward_nft",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256[]",
                "name": "ids",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "amounts",
                "type": "uint256[]"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "safeBatchTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "uri",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
const CHAIN = "mumbai"      // siet na ktorej je smart kontrakt

const BASE_URL = "http://localhost:4000"     //URL mojej api

Moralis.start({serverUrl: SERVER_URL, appId: APP_ID});
let web3;


async function login(){

    const login =  $("#input_login").val();
    const password = $("#password_login").val();

    const login_data = JSON.stringify({ username: login, password: password});
    console.log(login_data);
    //console.log(LOGIN_URL);


    $.ajax({
        type: 'POST',
        url: BASE_URL + '/users/login',
        data: login_data,
        crossDomain:true,
        dataType: 'json',
        format: 'json',
        contentType: "application/json",
        accepts: {
            text: "application/json"
        },
        success: function (result) {
            console.log("success ");
            var token = result;
            console.log(result.data.token.toString());

            if(result.data !== undefined){

                onLoggedIn(result.data)
            }
        },
        //complete: function (jqXHR, textStatus) {
        //},
        error: function (req, status, error) {

            //todo ERROR handling - messages
            console.log(error + " from server");
        }
    });
}


async function metamaskLogin(){

    let web3;

    if (window.ethereum) {

        web3 = new Web3(window.ethereum)
        console.log("have metamask")
        await ethereum.enable();    //uzivatel povoli pristup k metamask a pyta ucet

        const account = await web3.eth.getAccounts();
        const loginData =  JSON.stringify({
            address: account
        }) ;
        console.log(loginData);

        $.ajax({
            type: 'POST',
            url: BASE_URL + '/users/metamaskLogin',
            data: loginData,
            crossDomain:true,
            dataType: 'json',
            format: 'json',
            contentType: "application/json",
            accepts: {
                text: "application/json"
            },
            success: function (result) {
                console.log("success ");
                var token = result;
                console.log(result.data.token.toString());

                if(result.data !== undefined){

                    onLoggedIn(result.data)
                }
            },
            //complete: function (jqXHR, textStatus) {
            //},
            error: function (req, status, error) {

                //todo ERROR handling - messages
                console.log(error + " from server");
            }
        });

    }


}


function onLoggedIn(data){

    //token si ukladam do local storage, ako sessionId. pri pri novom prihlaseni je generovany novy token
    localStorage.setItem("nftLoggedToken", data.token.toString());    //token je identifikator pre daneho uzvatela
    localStorage.setItem("loggedUser", data.username.toString());
    localStorage.setItem("loggedUserId", data.userId.toString());
    localStorage.setItem("loggedEthAddress", data.addresses[0].toString());

    window.location = BASE_URL + "/dashboard"
}


// async function init(){
//
//     let currentUser = Moralis.User.current();
//
//     if (!currentUser){  //ak nie je user prihlaseny
//
//         try{
//             user = await  Moralis.authenticate({ signingMessage: "Signing to your acount"})
//             window.location.pathname = "/index.html";
//         }catch (error){
//
//             console.log(error)
//         }
//     }
//     else {
//         // user authenticated
//         window.location.pathname = "/index.html"
//     }
//
//     web3 = await Moralis.Web3.enable(); //pouzivam zabudovane web 3 v morales
//     let accounts = await web3.eth.getAccounts();    // prave prihlaseny ucet
//     //console.log(accounts);
//
//     const urlParams = new URLSearchParams(window.location.search);
//     const nftId = urlParams.get("nftId");
//     //console.log(nftId);
//     document.getElementById("token_id").value = nftId;      //asi nepouzijem
//     document.getElementById("address_input").value = accounts[0] // predpokladam, ze nft mintujem sebe
// }

const loginBtn = $("#login_submit_btn");
const loginMetamaskBtn = $("#login_metamask_btn");

loginBtn.click(login);
loginMetamaskBtn.click(metamaskLogin);
//init();