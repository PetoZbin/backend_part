const db = require("../db/db");
const {emptyOrRows} = require("../db/db.helper");


async function insertAddress(userId, address){


    const sql = `INSERT INTO addresses (user_id, address) VALUES (?,?)`;

    return db.query(sql, [userId, address]);
}

async function getAddressesByUserId(userId){   // natiahne uzivatelove adresy

    const sql = `SELECT address FROM addresses WHERE user_id = ?`

    const res = await db.query(sql, [userId]);
    const data = emptyOrRows(res);
    return data;
}

async function deleteAddress(address){

    const sql = 'DELETE FROM addresses WHERE address = ?';

    return await db.query(sql,[address]);
}

async function checkUserHasAddress(userId, address){   // ci neposiela duplicitny udaj o dosiahnuti checkpointu

    const sql = `SELECT EXISTS(SELECT addressId FROM addresses WHERE user_id = ? AND address =?) AS 'exists'`

    const res = await db.query(sql, [userId, address]);
    const data = emptyOrRows(res);

    return data[0];
}


module.exports = {insertAddress, deleteAddress, getAddressesByUserId, checkUserHasAddress}