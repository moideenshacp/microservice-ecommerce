const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name:String,
    email:String,
    password:String,

})
module.exports = User = mongoose.model("user",userSchema)