var mysql = require('mysql')
var port = 8889; //change this to your port
var connection = mysql.createConnection({
    host : 'localhost',
    port : '8889',
    user : 'root',
    password : 'root',
    database : 'Exercise1_login'
})
/*
connection.connect( (err) => {
    if(err) {
        console.log("error!")
    }
    else {
        console.log("connected perfectly")
    }
})
*/
module.exports = connection;