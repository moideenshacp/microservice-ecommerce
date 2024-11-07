const mongoose = require('mongoose')
const product = require('../product-service/product')
const Schema = mongoose.Schema

const orderSchema = new Schema({
  products: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
    },
  ],
  user: String,
  total_price: Number,
});
module.exports = Order = mongoose.model("order",orderSchema)