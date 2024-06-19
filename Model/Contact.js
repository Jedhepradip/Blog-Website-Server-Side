import mongoose from "mongoose";

const Contact = new mongoose.Schema({
    Name:{
        type:String,
        require:true
    },
    Number:{
        type:Number,
        require:true,
    },
    Subject:{
        type:String,
        require:true,
    },
    Message:{
        type:String,
        require:true
    }
})

export default mongoose.model("Contact",Contact)