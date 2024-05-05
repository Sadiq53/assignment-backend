let express = require('express');
let app = express();
let cors = require('cors')
let requestIp = require('request-ip')
let routes = require('./config/allRoutes')

// app.use(requestIp);
app.use(express.json());
app.use(express.urlencoded({ extended : true }))
app.use(cors());
app.use(routes);

const PORT = process.env.PORT || 8080
app.listen(PORT, (req, res)=>{
    console.log("server running with port", PORT)
});
