let route = require('express').Router();
let UserSchema = require("../model/UserSchema")
let adminSchema = require("../model/AdminSchema")
let key = require("../config/token_keys")
let jwt = require("jsonwebtoken")
let sha = require("sha1")


route.get("/", async(req, res)=>{
    
})


route.get("/:id", async(req, res)=>{
    if(req.headers.authorization){
        let ID = jwt.decode(req.params.id, key)
        let userData = await adminSchema.find({_id : ID?.id})
        if(userData?.length != 0){
            res.send({status : 200, result : userData[0]})
        }else{
            res.send({status : 403})
        }
    }
})


route.post("/", async(req, res)=>{

    // Extracting Device Info------------
    let userAgent = req.body.device;
    userAgent = userAgent.split(";")
    userAgent = userAgent[0].split("(")
    let deviceName = userAgent[1];
    // Extracting Device Info------------

    //Getting Current Date and Time
    const currentDate = new Date();
    const options = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
    };

    const formattedDate = currentDate.toLocaleString('en-US', options);
    //Getting Current Date and Time
    
    let email = req.body.email;
    let password = sha(req.body.password);
    let userData = await adminSchema.find({email : email})
    if(userData?.length != 0){
        if(userData[0]?.password === password){

            //Adding Additional Data
            let basic_info = {
                device : deviceName,
                login : formattedDate,
                logout : null
            }
            let data = await adminSchema.updateMany({email : email}, {$push : {basic_info : basic_info}})
            //Adding Additional Data

            let obj = {id : userData[0]?._id};
            let token = jwt.sign(obj, key)
            res.send({ status : 200, errType : 0, token : token })
        }else{
            let attempt = userData[0].login_attempt
            if(attempt <= 2){
                attempt++
                await adminSchema.updateMany({email : email}, { login_attempt : attempt })
                res.send({ status : 403, errType : 2, timeout : false })
            }else{
                await adminSchema.updateMany({email : email}, { login_attempt : 0 })
                await adminSchema.updateMany({email : email}, { attempt_fail : true })
                setTimeout(async()=>{
                    await adminSchema.updateMany({email : email}, { attempt_fail : false })
                }, 60 * 1000)
                res.send({ status : 403, errType : 2, timeout : true })
            }
        }
    }else{
        res.send({status : 403, errType : 1})
    }
})

route.get("/check-attempt/:mail", async(req, res)=>{
    let email = req.params.mail;
    let userData = await adminSchema.find({email : email})
    if(userData?.length != 0){
        let attempt = userData[0]?.attempt_fail;
        if(attempt){
            res.send({success : true})
        }else{
            res.send({success : false})
        }
    }else{
        res.send({success : false})
    }
})

route.post("/logout", async(req, res)=>{
    let token = req.body.id;
    let ID = jwt.decode(token, key)

     // Extracting Device Info------------
        let userAgent = req.body.device;
        userAgent = userAgent.split(";")
        userAgent = userAgent[0].split("(")
        let deviceName = userAgent[1];
     // Extracting Device Info------------

    //Getting Current Date and Time
    const currentDate = new Date();
    const options = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
    };

    const formattedDate = currentDate.toLocaleString('en-US', options);
    //Getting Current Date and Time
    
    let userData = await adminSchema.find({_id : ID?.id})
    if(userData?.length != 0){
        let basic_info = userData[0].basic_info;
        let objIndex = basic_info.findIndex((value) => (value.device === deviceName && value.logout === null));
        if (objIndex !== -1) {
            basic_info[objIndex].logout = formattedDate;
            await adminSchema.updateMany({_id: ID?.id}, {$set: { "basic_info.$[elem]": basic_info[objIndex] }}, { arrayFilters: [{ "elem.device": deviceName, "elem.logout": null }] });
        }
        res.send({success : true})
    }else{
        res.send({success : false})
    }
})


route.put("/:id", async(req, res)=>{})


route.delete("/:id", async(req, res)=>{})

// route.post("/device", async(req, res)=>{
//     let userAgent = req.body;
//     let Arr = Object.keys(userAgent);  // Converting Object into Array
//     let Str = Arr.toString();          // Converting Array into String
//     Str = Str.split(";");              // Splitting the String
//     let data = Str[0];
//     data = data.split("(");
//     let deviceName = data[1];
//     console.log(deviceName)
// })

module.exports = route;