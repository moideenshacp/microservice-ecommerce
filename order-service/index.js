const express = require('express')
const app = express()
const mongoose = require('mongoose')
const jwt  = require('jsonwebtoken')
const amqp = require('amqplib')
const Order = require('./order')
const isAuthenticated = require('../isAuthenticated.js')
var channel,connection
async function connectDB() {
    try {
        await mongoose.connect("mongodb://localhost/order-service");
        console.log("order-service db connected");
    } catch (error) {
        console.error(error);
    }
}
connectDB();
app.use(express.json())

async function connect(){
    const amqpServer = "amqp://localhost:5672"
    connection =await amqp.connect(amqpServer)
    channel = await connection.createChannel()
    await channel.assertQueue("ORDER")
}

function createOrder(products,userEmail){
   let total =0  
   const productIds = products.map(product => {
    total += product.price;
    return { product_id: product._id };
});
   const newOrder = new Order({
    products:productIds,
    user:userEmail,
    total_price:total
   })
   newOrder.save()
   return newOrder
}


connect().then(()=>{
    channel.consume("ORDER",data=>{
        const {products,userEmail} = JSON.parse(data.content)
        const newOrder = createOrder(products,userEmail)
        console.log("consuming Order queue");
        console.log(products,"products");
        console.log(userEmail,"userEmail");

        channel.ack(data)
        
        channel.sendToQueue("PRODUCT",Buffer.from(JSON.stringify({newOrder})))
    })
})




app.listen(9090,()=>{
    console.log("order service started at 9090");
    
})
