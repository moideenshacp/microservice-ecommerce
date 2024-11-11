const express = require('express')
const app = express()
const mongoose = require('mongoose')
const jwt  = require('jsonwebtoken')
const amqp = require('amqplib')
const Product = require('./product')
const isAuthenticated = require('./isAuthenticated.js')
var channel,connection,order
async function connectDB() {
    try {
        await mongoose.connect("mongodb://mongodb-service:27017/product-service");
        console.log("Product-service db connected");
    } catch (error) {
        console.error(error);
    }
}
connectDB();
app.use(express.json())

async function connect() {
    try {
        const amqpServer = "amqp://rabbitmq-service:5672";
        const connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        await channel.assertQueue("PRODUCT");
        await channel.assertQueue("ORDER");  
        console.log("Connected to RabbitMQ and queues are set up.");
    } catch (error) {
        console.error("RabbitMQ connection error:", error);
    }
}

connect();
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

app.post('/product/buy', isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });

    console.log('Product:', products);
    console.log("Email:", req.user.email);

    if (!channel) {
        console.error("Channel is not initialized.");
        return res.status(500).json({ error: "RabbitMQ channel is not available" });
    }

    try {
        channel.sendToQueue(
            "ORDER",
            Buffer.from(
                JSON.stringify({
                    products,
                    userEmail: req.user.email
                })
            )
        );
        console.log("Message sent to ORDER queue");

        return res.json({ message: "Order request sent", products });
    } catch (error) {
        console.error("Error sending message to ORDER queue:", error);
        return res.status(500).json({ error: "Failed to send order request" });
    }
});

app.listen(8080,()=>{
    console.log('h2');
    console.log("product service started at 8080");
    
})
