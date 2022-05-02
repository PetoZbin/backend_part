
const localStrategy = require('passport-local').Strategy



function authenticateUser(email, password) {



}

function serializeUser(user){


}

function deserializeUser(id){


}



function initialize(passport){

    passport.use(new LocalStrategy({username: 'username', password: "password"}), authenticateUser)

    const user = getUserByEmail(email);

    if(user == null){

        return done(null, false, {message: 'No user with this email'})
    }

}

module.exports = initialize