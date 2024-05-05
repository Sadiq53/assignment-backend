const mongoose = require("mongoose")
mongoose.connect("mongodb+srv://Sadiq53:ZX7t5iTyKPCNcMOE@cluster0.cunxumm.mongodb.net/assignment");
// mongoose.connect("mongodb://0.0.0.0:27017/assignment");

mongoose.connection.on("connected", ()=>{
    console.log("connected")
})
mongoose.connection.on("error", (err)=>{
    console.log(err)
})


// Sadiq53
// ZX7t5iTyKPCNcMOE

module.exports = mongoose;