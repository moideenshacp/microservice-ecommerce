const mongoose = require('mongoose')
const Schema = mongoose.Schema

const orderSchema = new Schema({
  products: [
    {
      product_id: String,
    },
  ],
  user: String,
  total_price: Number,
});
module.exports = Order = mongoose.model("order",orderSchema)