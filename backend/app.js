const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const routes = require("./routes");

require("dotenv").config();

const app = express();

app.use(morgan('dev'));
app.use(cors());

app.use("/", routes);

app.get("/", (req, res) => res.json({ msg: "API initialized" }).status(200));

module.exports = app;
