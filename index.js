import express from 'express';
import chalk from 'chalk';
import IndexRouter from './Router/Index.js';
import bodyParser from 'body-parser';
import cors from "cors"
import db from './db/db.js';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())

app.use(express.static("uploads"))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", IndexRouter)

app.listen(PORT, () => {
    console.log("\n\n"+chalk.green.bold(`Server running on http://localhost:${PORT}`));
});
