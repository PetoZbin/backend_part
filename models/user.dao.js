const db = require("../db/db");
const {emptyOrRows} = require("../db/db.helper");

async function getUserByUsername(username){

    const sql = `SELECT userId, username, password, date, email from users WHERE username = ? LIMIT 1`

    const res = await db.query(sql, [username]);
    const data = emptyOrRows(res);
    return data[0];
}

async function getUserById(userId){

    const sql = `SELECT userId, username, password, date, email from users WHERE userId = ? LIMIT 1`

    const res = await db.query(sql, [userId]);
    const data = emptyOrRows(res);
    return data[0];
}

async function getUserByAddress(address){

    console.log(address)

     const sql = `SELECT users.userId, users.username, users.password, users.date, users.email
 FROM users INNER JOIN addresses ON users.userId=addresses.user_id WHERE address=?`


    const res = await db.query(sql,[address]);
    const data = emptyOrRows(res);
    return data[0];
}

async function insertUser(user){

    const sql = `INSERT INTO users (username, email, password) VALUES (?,?,?)`;

    return await db.query(sql, [user.username, user.email, user.password]);
}


module.exports = {getUserByUsername, getUserById, getUserByAddress ,insertUser}