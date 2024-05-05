let route = require('express').Router();
let userSchema = require("../model/UserSchema")
let key = require("../config/token_keys")
let jwt = require("jsonwebtoken")
let sha = require("sha1")


route.get("/", async(req, res)=>{
    let userData = await userSchema.find({});
    res.send(userData)
})

route.post("/block/:id", async(req, res)=>{
    let ID = req.params.id;
    let userData = await userSchema.find({_id : ID})
    if(userData?.length != 0){
        await userSchema.updateOne({_id : ID}, {block : true})
        res.send({success : true})
    }else{
        res.send({success : false})
    }
    
})


route.post("/unblock/:id", async(req, res)=>{
    let ID = req.params.id;
    let userData = await userSchema.find({_id : ID})
    if(userData?.length != 0){
        await userSchema.updateOne({_id : ID}, {block : false})
        res.send({success : true})
    }else{
        res.send({success : false})
    }

})

route.get("/:id", async(req, res)=>{
    if(req.headers.authorization){
        let ID = jwt.decode(req.params.id, key)
        let userData = await userSchema.find({_id : ID.id})
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
    let userData = await userSchema.find({email : email})
    if(userData?.length != 0){
        let block = userData[0]?.block;
        if(block){
            res.send({status : 402, errType : 1})
        }else{
            if(userData[0]?.password === password){

                //Adding Additional Data
                let basic_info = {
                    device : deviceName,
                    login : formattedDate,
                    logout : null
                }
                let data = await userSchema.updateMany({email : email}, {$push : {basic_info : basic_info}})
                //Adding Additional Data
    
                let obj = {id : userData[0]?._id};
                let token = jwt.sign(obj, key)
                res.send({ status : 200, errType : 0, token : token })
            }else{
                let attempt = userData[0].login_attempt
                if(attempt <= 1){
                    attempt++
                    await userSchema.updateMany({email : email}, { login_attempt : attempt })
                    res.send({ status : 403, errType : 2, timeout : false })
                }else{
                    await userSchema.updateMany({email : email}, { login_attempt : 0 })
                    await userSchema.updateMany({email : email}, { attempt_fail : true })
                    setTimeout(async()=>{
                        await userSchema.updateMany({email : email}, { attempt_fail : false })
                    }, 60 * 1000)
                    res.send({ status : 403, errType : 2, timeout : true })
                }
            }
        }
    }else{
        res.send({status : 403, errType : 1})
    }
})

route.get("/check-attempt/:mail", async(req, res)=>{
    let email = req.params.mail;
    let userData = await userSchema.find({email : email})
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


route.post("/signup", async(req, res)=>{

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

    req.body.password = sha(req.body.password);
    let email = req.body.email;
    let userData = await userSchema.find({email : email})
    if(userData?.length == 0){
        let data = await userSchema.create(req.body)
        
        //Adding Additional Data
        let basic_info = {
            device : deviceName,
            login : formattedDate,
            logout : null
        }
        data.basic_info = basic_info
        data.count += 1
        await userSchema.updateMany({email : email}, data)
        //Adding Additional Data

        let obj = {id : data._id};
        let token = jwt.sign(obj, key)
        res.send({ status : 200, errType : 0, token : token })
    }else{
        res.send({status : 403, errType : 1})
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
    
    let userData = await userSchema.find({_id : ID?.id})
    if(userData?.length != 0){
        let basic_info = userData[0].basic_info;
        let objIndex = basic_info.findIndex((value) => (value.device === deviceName && value.logout === null));
        if (objIndex !== -1) {
            basic_info[objIndex].logout = formattedDate;
            await userSchema.updateMany({_id: ID.id}, {$set: { "basic_info.$[elem]": basic_info[objIndex] }}, { arrayFilters: [{ "elem.device": deviceName, "elem.logout": null }] });
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