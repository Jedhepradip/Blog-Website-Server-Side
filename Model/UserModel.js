import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
    Name: {
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true,
        unique: true,
    },
    Password: {
        type: String,
        required: true,
    },
    Cpassword: {
        type: String,
    },
    posts: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
    Comment: [{ type: Schema.Types.ObjectId, ref: "Comment" }]
});

export default mongoose.model("UserDate", userSchema);
