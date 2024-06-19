import mongoose from "mongoose";
import chalk from "chalk";
import dotenv from 'dotenv'
dotenv.config()

const db = mongoose.connect(process.env.db)

.then(()=>{
    console.log(chalk.green.bold('Database Connected Successfully'));

}).catch((Error)=>{
    console.log(Error);
})

export default db;