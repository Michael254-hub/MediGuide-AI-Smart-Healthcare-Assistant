require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { MessagingResponse } = require("twilio").twiml;

const app = express();

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

//MomgoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch(err => console.log(err));

app.listen(3000, () =>{
    console.log("Server running on port 3000")
})