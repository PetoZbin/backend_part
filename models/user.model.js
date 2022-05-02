//model subor pre mongo db

const mongoose = require("mongoose");
const {Schema} = mongoose;
const uniqueValidator = require("mongoose-unique-validator");
const userValidators = require("../validators/user_validators");



const userSchema = new Schema({

   username: {
        type: String,
        required: true,
        unique: true,
        validate: userValidators.usernameValidator
   },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: userValidators.emailValidator
    },
    password: {
        type: String        //hash
    },
    addresses: {       //eth address usera sluzi na transakcie smerom k userovi

        type: Array,
        items: {type: String},
        validate: userValidators.addressValidator,
        //"default": []
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

// userSchema.path('email').validate(async (email) => {
//
//     const numDuplicates = await mongoose.models.user.countDocuments({email: email});
//
//     return !numDuplicates;  // ak je 0 - vrati true, validacia uspesna, ostatne cisla na false - neuspesna
//
// }, "Email already exists")

userSchema.set("toJSON", {

    transform: (document, returnObject) => {

        returnObject.id = returnObject._id.toString();
        delete returnObject._id;
        delete returnObject.__v; // value ktora defaultne prichadza z mongo DB
        delete returnObject.password;
    }

});

//userSchema.plugin(uniqueValidator, {message: "{PATH} already used by another user!"});

const User = mongoose.model("user", userSchema);

module.exports = User;