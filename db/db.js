const MySql = require('mysql2/promise');
const dbconfig = require('../config/db.config');


async function query(sql, params, bulkInsert = false){

    const connection = await MySql.createConnection(dbconfig.db);

    if (bulkInsert){

        //const format =  connection.format(sql,params);
        //console.log(format);
        const [results,] = await connection.query(sql, params);
        await connection.end()
        return results;
    }
    else {
        const format =  connection.format(sql,params);
        console.log(format);
        const [results,] = await connection.execute(sql, params);
        await connection.end()
        return results;
    }
}


module.exports = {query}