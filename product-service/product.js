const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
    name:String,
    description:String,
    price:Number

})
module.exports = Product = mongoose.model("product",productSchema)