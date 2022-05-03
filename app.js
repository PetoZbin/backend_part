const Moralis = require("moralis/node");
const Mongoose = require("mongoose");
const Express = require("express");
const Mysql = require("mysql");
const flash = require("express-flash");
const session = require("express-session");

const https = require("https");
const path = require("path");
const fs = require("fs");
const passport = require('passport');


const dbconfig = require('./config/db.config');

const auth = require("./middlewares/auth");
const errors = require("./middlewares/errors");
const unless = require("express-unless");

const nodeSchedule = require('node-schedule')
const AWARDING_JOB = "AWARDING";
const {awardCompetitions, makeCompetitionsOngoing} = require("./services/competition.services");


require('dotenv').config(); //nasetovanie environment variables do process. env

const app = Express();
process.env.TZ = "Europe/Prague";

//const initializePassport = require('./passport-config')


//initializePassport(passport);   // inicializacia kniznice passport


//connection to mySql


// const db = Mysql.createConnection(dbconfig.db);
// db.connect();
//
// db.connect((error) =>{
//
//         if(error){
//             console.log(error)
//         }
//         console.log("Mysql Db connected")
// }
//
//
// );


// Mongoose.Promise = global.Promise;
// Mongoose.connect(dbconfig.db, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(
//     () => {
//         console.log("DB connected");
//     },
//     (error) => {
//         console.log("DB connection error: " + error);
//     }
// );

//auth.authenticateToken.unless = unless;

// app.use(
//     auth.authenticateToken.unless({
//
//             path: [
//                // {url: "/users/", methods: ["GET"]}, //pozor
//                 {url: "/users/login", methods: ["POST"]},
//                 {url: "/users/register", methods: ["POST"]},
//                 {url: "/users/:userId/user-nfts", methods: ["GET"]},
//                 {url: "/users/user-profile", methods: ["GET"]},
//             ],
//         }
//     )
// );

app.use(Express.json({limit: '50mb'}));

//api route files
app.use("/users", require("./routes/user.routes"));
app.use("/tokens", require("./routes/tokens.routes"));
app.use("/competition", require("./routes/competition.routes"));
app.use("/notification", require("./routes/notification.routes"));

//static files
app.use(Express.static('public'));
app.use('/css', Express.static(__dirname + 'public/css'));
app.use('/js', Express.static(__dirname + 'public/js'));
app.use('/img', Express.static(__dirname + 'public/img'));
app.use('/ABIs', Express.static(__dirname + 'public/ABIs'));

//set views
app.set('views', './views');
app.set('view engine', 'ejs');
// app.use(flash());
// app.use(session({
//
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false        //ukladanie empty value ked nie je nijaka hodnota
// }));
//
//
// app.use(passport.initialize());  //inicializacia passport - interna funkcia kniznice
// app.use(passport.session()) ;    //praca so session - mame ju v sekcii app.use(session)





app.use(errors.errorHandler);



app.get('', (req,res) => {
    // res.sendFile(__dirname + '/views/login.html')
    res.render('login')
})

app.get('/login', (req,res) => {

   // res.sendFile(__dirname + '/views/login.html')
    res.render('login')
})

app.get('/dashboard', (req,res) => {

    // res.sendFile(__dirname + '/views/login.html')
    res.render('dashboard')
})

///:nftId
app.get('/transfer', (req,res) => {
    //res.sendFile(__dirname + '/views/login.html');
    //res.render('transfer', { nftId: req.params.nftId });
    res.render('transfer');
})

app.get('/mint', (req,res) => {
    // res.sendFile(__dirname + '/views/login.html')
    res.render('mint');
})


// const sslServer = https.createServer({
//
//     key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')), //sync pretoze aplikacia by nemala byt spustena bez nacitania certifikatu
//     cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
//
// }, app);
//
//
// sslServer.listen(process.env.port || 4000,  function (req,res){
//
//     console.log("Secure server ready on port 4000");
//
//    // res.writeHead(200, {'Content-Type': 'text/html'});
//
//     //var readStream = fs.createReadStream(__dirname + "/website/index.html", 'utf-8');
//    // readStream.pipe(res);
// });





app.listen(process.env.port || 4000,function (){

    console.log("Ready")
});


console.log(Moralis.applicationId)



//kazdu minutu vyhodnot skoncene sutaze
nodeSchedule.scheduleJob(AWARDING_JOB ,'* * * * *', ()=>{

    makeCompetitionsOngoing();

    console.log(new Date().toString())
    console.log("awarding @" + new Date().toISOString() + "started");
    let promise = awardCompetitions();

});