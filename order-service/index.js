const express = require('express')
const app = express()
const mongoose = require('mongoose')
const jwt  = require('jsonwebtoken')
const amqp = require('amqplib')
const Order = require('./order')
var channel,connection
async function connectDB() {
    try {
        await mongoose.connect("mongodb://mongodb-service:27017/order-service");
        console.log("order-service db connected");
    } catch (error) {
        console.error(error);
    }
}
connectDB();
app.use(express.json())

async function connect() {
    try {
        const amqpServer = "amqp://rabbitmq-service:5672";
        connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        await channel.assertQueue("ORDER");
        console.log("Connected to RabbitMQ and ORDER queue is set up.");
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
    }
}


async function createOrder(products, userEmail) {
    let total = 0;
    const productIds = products.map(product => {
        total += product.price;
        return { product_id: product._id };
    });

    const newOrder = new Order({
        products: productIds,
        user: userEmail,
        total_price: total
    });

    try {
        await newOrder.save();
        console.log("Order saved to database:", newOrder);
    } catch (error) {
        console.error("Failed to save order to database:", error);
    }
    
    return newOrder;
}


connect().then(() => {
    channel.consume("ORDER", (data) => {
        try {
            const { products, userEmail } = JSON.parse(data.content);
            console.log("consuming Order queue");
            console.log(products, "products");
            console.log(userEmail, "userEmail");

            const newOrder = createOrder(products, userEmail);
            console.log("New Order created:", newOrder);

            // Send acknowledgment
            channel.ack(data);

            // Send order details back to PRODUCT queue
            channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ newOrder })));
        } catch (error) {
            console.error("Error processing message from ORDER queue:", error);
        }
    });
}).catch(error => console.error("Error setting up consumer:", error));




app.listen(9090,()=>{
    console.log("order service started at 9090");
    
})
