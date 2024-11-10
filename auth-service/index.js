const express = require('express')
const app = express()
const mongoose = require('mongoose')
const User = require('./user')
const jwt  = require('jsonwebtoken')
async function connectDB() {
    try {
        await mongoose.connect("mongodb://mongodb-service/auth-service");
        console.log("Auth-service db connected");
    } catch (error) {
        console.error(error);
    }
}
connectDB();
app.use(express.json())

app.post('/auth/register',async(req,res)=>{
    const {email,name,password} = req.body
    const userExist = await User.findOne({email})
    
    if(userExist){
        return res.json({message:"user aready exists"})
    }else{
        const newUser = new User({
            name,
            email,
            password
        })
        await newUser.save()
        return res.json(newUser)
    }
     
})

app.post('/auth/login',async(req,res)=>{
    const {email,password} = req.body
    const userExist =await User.findOne({email})

    if(!userExist){
        return res.json({message:"user not exist"})
    }else{
        
        if(password !== userExist.password){
            return res.json({message:"password is incorrect"})
        }
        const payload ={
            email,
            name:userExist.name
        }
        jwt.sign(payload,"secret",(err,token)=>{
            if(err)console.log(err)
            else{
                return res.json({token})
         }
            
        })
    }

})

app.listen(7070,()=>{
    console.log("auth service started at 7070");
    
})