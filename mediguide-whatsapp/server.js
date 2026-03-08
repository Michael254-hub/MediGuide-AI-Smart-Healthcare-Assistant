const express = require("express"); //handles routes
const bodyParser = require("body-parser"); 
const mongoose = require("mongoose"); 
const { MessagingResponse } = require("twilio").twiml;
require("dotenv").config(); /


// Setting up the Express App
const app = express();

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

//MongoDB Connection (Database)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!")) //if the connection works
  .catch(err => console.log(err)); //if the connection fails

app.listen(3000, () =>{
    console.log("Server running on port 3000")
})

//Webhook endpoint
app.post("/whatsapp", async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;

  console.log("Message from:", from);
  console.log("Message:", incomingMsg);

  const twiml = new MessagingResponse();

  // Simple test reply
  twiml.message("Welcome to MediGuide. Please describe your symptoms.");

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});