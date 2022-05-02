const {ValidationError} = require("../middlewares/errors");
const dbHelper = require("../db/db.helper");
const notifDao = require("../models/notification.dao");

async function getUserNotifs({userId}, callback){


    try {

        if (userId === undefined){

            return callback(new ValidationError("Invalid userId acquired!"))
        }

        //stiahni vsetky notifikacie uzivatela

        const notifs = await notifDao.getUserNotifications(userId);

        if (!notifs.length){

            return callback(null, [])

        }

        let notifIds = [];

        for (let notif of notifs){

            notifIds.push(notif.notifId);
        }

        const updateRes = await notifDao.updateUserNotificationRead(notifIds);

        if (updateRes.affectedRows === notifs.length){
            return callback(null, notifs)
        }
        else {
            return callback(new Error("DB read notifications error"));
        }


    }catch (error){
        console.log(error)
        return callback(error);
    }
}

module.exports = {getUserNotifs}