const express = require('express')
const app = express()
const mongoose = require('mongoose')
const jwt  = require('jsonwebtoken')
const amqp = require('amqplib')
const Product = require('./product')
const isAuthenticated = require('../isAuthenticated.js')
var channel,connection,order
async function connectDB() {
    try {
        await mongoose.connect("mongodb://localhost/product-service");
        console.log("Product-service db connected");
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
    await channel.assertQueue("PRODUCT")
}
connect()
//create product
app.post('/product/create',isAuthenticated,async(req,res)=>{
    const {name,description,price} = req.body
    const newProduct = new Product({
        name,
        description,
        price
    })
    await newProduct.save()
    return res.json(newProduct)
})

//buy a product

app.post('/product/buy',isAuthenticated,async(req,res)=>{
    const {ids} = req.body
    const products = await Product.find({_id:{$in:ids}})

    channel.sendToQueue(
        "ORDER",
        Buffer.from(
            JSON.stringify({
                products,
                userEmail:req.user.email
            })
        )
    )

    channel.consume("PRODUCT",data=>{
        console.log('consuming product queue');
        
        order = JSON.parse(data.content)
        
        console.log(order,"order cheytha products");
        channel.ack(data)
        return res.json(order)
    })
})

app.listen(8080,()=>{
    console.log("product service started at 8080");
    
})
