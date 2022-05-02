//const mongoose = require("mongoose");

// db imports  Mysql2 ↓
const db = require('../db/db')
const dbHelper = require('../db/db.helper')

const web3 = require("web3");
const {emptyOrRows} = require("../db/db.helper");

const isEmailUsed = async function (email) {

   // const numDuplicates = await mongoose.models.user.countDocuments({email: email});

    //return !numDuplicates;  // ak je 0 - vrati true, validacia uspesna, ostatne cisla na false - neuspesna

    console.log(email)

    const sql = `SELECT EXISTS (SELECT email FROM users WHERE email = ?) AS trace `;

    try{
        const res = await db.query(sql, [email]);
        const data = emptyOrRows(res);

        console.log(data)

        const trace = data[0].trace;    //trace je tinyint 0/1

        if (trace){
            return true;
        }
    }catch (error){
        console.log(error);
        return true;    //zamedz postupu
    }
    return false;
};

const checkEmailString = function (email) {

    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return email.match(pattern);
};

const isUsernameUsed = async function (username) {

    const sql = `SELECT EXISTS (SELECT username FROM users WHERE username = ?) AS trace `;

    try{
        const res = await db.query(sql, [username]);
        const data = emptyOrRows(res);

        const trace = data[0].trace;    //trace je tinyint 0/1

        if (trace){
            return true;
        }
    }catch (error){
        console.log(error);
        return true;    //zamedz postupu
    }
    return false;
};

const checkUsernameString = function (username) {

    const pattern = /^[a-zA-Z0-9]+$/;   // pismena + cisla
    return username.match(pattern);
};

const validatePassword = function(password){

    const pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
    return password.match(pattern);
};

const isAddressUsed = async function (address) {

    //const numDuplicates =  await mongoose.models.user.countDocuments({addresses: address});
    //return !numDuplicates;

    const sql = `SELECT EXISTS (SELECT address FROM addresses WHERE address = ?) AS trace `;

    try{
        const res = await db.query(sql, [address]);
        const data = emptyOrRows(res);

        const trace = data[0].trace;    //trace je tinyint 0/1

        if (trace){
            return true;
        }
    }catch (error){
        console.log(error);
        return true;    //zamedz postupu
    }
    return false;
};

const validateAddress = async function (address) {

    return web3.utils.isAddress(address);
};


async function validateRegistration(params, validation_msg){


    if(! await validateAddress(params.address)){
        validation_msg.isValid = false;
        validation_msg.address = 'Address not valid!';
    }

    if(await isAddressUsed(params.address)){

        validation_msg.isValid = false;
        validation_msg.address = validation_msg.address.concat(" ", 'Address already used!');
    }

    if(!checkUsernameString(params.username)){
        validation_msg.isValid = false;
        validation_msg.username = validation_msg.username.concat('Username not valid!');
    }

    if(await isUsernameUsed(params.username)){

        validation_msg.isValid = false;
        validation_msg.username = validation_msg.username.concat('Username already used!');
    }

    if(!checkEmailString(params.email)){

        validation_msg.isValid = false;
        validation_msg.email = validation_msg.email.concat('Email not valid!');
    }

    if(await isEmailUsed(params.email)){
        console.log(params.email)
        validation_msg.isValid = false;
        validation_msg.email = validation_msg.email.concat(' ', 'Email already used!');
    }

    if(!validatePassword(params.password)){

        validation_msg.isValid = false;
        validation_msg.password = validation_msg.password.concat('Invalid password!');
    }

    return validation_msg;
}




const emailValidator = [

    { validator: checkEmailString, msg: 'Wrong email format!' },
    { validator: isEmailUsed, msg: 'Email already used!' }
]

const usernameValidator = [

    { validator: checkUsernameString, msg: 'Username has to cointain at least 1 character - letters and numbers only!' },
    { validator: isUsernameUsed, msg: 'Username already used!' }
]

const addressValidator = [

   // { validator: validateAddress, msg: 'Address not valid!' },
    { validator: isAddressUsed, msg: 'Address already used!' }
]

module.exports={emailValidator, usernameValidator, addressValidator, validatePassword, validateRegistration, validateAddress};