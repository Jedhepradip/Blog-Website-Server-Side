import mongoose from "mongoose";
const { Schema } = mongoose;

const blogSchema = new Schema({
    Image: {
        type: String,
    },
    Title: {
        type: String,
    },
    Desc: {
        type: String,
    },
    Date: {
        type: String,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'UserDate',
    },
    comment: [{
        comments: {
            type: String
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'UserDate'
        }
    }
    ],
    likes: [{
        like: {
            type: Schema.Types.ObjectId,
            ref: 'UserDate'
        }
    }] 
},
    {
        timestamps: true
    });

export default mongoose.model("Blog", blogSchema);
