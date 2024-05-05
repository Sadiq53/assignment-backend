let routes = require('express').Router()

routes.use("/user", require("../controller/UserController"));
routes.use("/admin", require("../controller/AdminController"));

module.exports = routes