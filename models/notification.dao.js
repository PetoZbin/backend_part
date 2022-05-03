const db = require("../db/db");
const {emptyOrRows} = require("../db/db.helper");
const timeHelper = require("../helpers/time.helper")

async function insertNotification(userId , notifHeading, notifText, notifUrl= 'NULL'){

    const sql = `INSERT INTO notifs (userId , notifHeading, notifText) VALUES (?,?,?,?)`;

    //console.log(waypointList)

    return await db.query(sql, [userId, notifHeading, notifText, notifUrl]);
}

async function updateUserNotificationRead(notifIdList){    //bud este nevidel alebo uz videl ale na inom zariadeni - 15 minutove interval medzi dotazmi (android)

    const sql = `UPDATE notifs SET wasRead=1 WHERE notifId IN (?)`;
    //console.log(waypointList)

    return await db.query(sql, [notifIdList], true);
}


async function getUserNotifications(userId){    //bud este nevidel alebo uz videl ale na inom zariadeni - 15 minutove interval medzi dotazmi (android)

    const sql = `SELECT * FROM notifs WHERE userId = ? AND ((wasRead = 0) OR (ABS(TIMESTAMPDIFF(MINUTE,timeCreated, ?)) < 15))`;

    const res = await db.query(sql, [userId, timeHelper.getMySqlTime()]);
    const data = emptyOrRows(res);
    return data;
}


async function deleteExpiredNotifs(){

    const sql = `DELETE FROM notifs WHERE ((wasRead = 1) AND (ABS(TIMESTAMPDIFF(HOUR ,timeCreated, NOW())) > 24)
                      OR (ABS(TIMESTAMPDIFF(HOUR ,timeCreated, NOW())) > 72))`;

    //console.log(waypointList)
    return await db.query(sql, []);

}


module.exports = {insertNotification, updateUserNotificationRead, getUserNotifications, deleteExpiredNotifs}