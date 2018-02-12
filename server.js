const express = require('express')
const app = express()

var fs = require('fs')
var session = require('express-session')

var bodyParser = require('body-parser')

var port = 3000

var connection = require('./db.js')
var middleware = require('./middleware.js')


app.use(express.static('./client/assets'))
app.use(express.static('./node_modules/jquery/dist/'))

var loginPage = fs.readFileSync('./client/login.html', 'utf8')
var createAccountPage = fs.readFileSync('./client/create-account.html', 'utf8')
var indexPage = fs.readFileSync('./client/index.html', 'utf8')

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
})

app.use(session({
    secret: '1234',
    resave: true,
    saveUninitialized: false,
    cookie: {
        expires: new Date(253402300000000)
    }
}))


app.get('/', middleware.authenticate, (req, res) => {
    res.send(indexPage)
})
app.get('/login', (req, res) => {
    res.send(loginPage)
})
app.get('/create-account', (req, res) => {
    res.send(createAccountPage)
})

var countSeconds = (recDate) => {
    var openTime = new Date(recDate);
    openTime.setTime(openTime.getTime() + 1 * 5 * 60 * 1000)
    var secondsToOpen = parseInt((openTime.getTime() - (new Date().getTime() - 1 * 60 * 60 * 1000)) / 1000)
    console.log(secondsToOpen)
    return (secondsToOpen)
}

app.post('/api/verify-user', (req, res) => {
    var email = req.body.txtEmail.toLowerCase()
    var password = req.body.txtPassword
    var dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ')

    var sqlQueryLogin = `select * from Users where email = "${email}"`
    connection.query(sqlQueryLogin, (err, result) => {
        if (err) {
            console.log(err)
            res.send({
                "success": false
            })
            return
        }
        if (result.length > 0) {
            var selectedUserId = result[0].userId;


            /*LAD OS LAVE BLOCK LOGIK HER??*/
            /*******************************/
            var compareLockTime = new Date()
            compareLockTime.setTime(compareLockTime.getTime() - 1 * 5 * 60 * 1000)
            compareLockTime = new Date(compareLockTime).toISOString().slice(0, 19).replace('T', ' ')
            console.log(compareLockTime)
            sqlQueryIsLocked = `select * from LoginHistory 
                                where userid = ${selectedUserId} and date > "${compareLockTime}" and verified = 0 and
                                date > (select max(date) from LoginHistory where userid = ${selectedUserId} and verified = 1)  order by date desc limit 3`
            connection.query(sqlQueryIsLocked, (error, lockResult) => {
                if(error) {
                    res.send({
                        "success": false
                    })
                    return
                }
                if (lockResult.length == 3) {
                    var secs = countSeconds(lockResult[2].date);
                    console.log(secs, "fra 3");

                    res.send({
                        "success": false,
                        secs
                    })
                    return
                    /*HER SKAL VI LÅSE BRUGEREN*/
                }

                /*******************************/
                if (result[0].password == password) {
                    req.session.userId = result[0].userId
                    res.send({
                        "success": true
                    })

                    var sqlQueryHistory = `insert into LoginHistory (userId, date, verified) 
                                       values (${selectedUserId}, "${dateTime}", 1)`

                    connection.query(sqlQueryHistory, (err, result) => {
                        if (err) {
                            console.log(err)
                            console.log("be aware, the history was not inserted.. fix this bug immidiately")
                        } else {
                            console.log("inserted history")
                        }
                    })

                } else {

                    var sqlQueryHistory = `insert into LoginHistory (userId, date, verified) 
                                       values (${selectedUserId}, "${dateTime}", 0)`
                    connection.query(sqlQueryHistory, (err, result) => {
                        if (err) {
                            console.log(err)
                            console.log("be aware, the history was not inserted.. fix this bug immidiately")
                        } else {
                            console.log("inserted history")
                            if (lockResult.length == 2) {
                                var secs = countSeconds(lockResult[1].date);
                                res.send({
                                    "success": false,
                                    secs
                                })
                                return
                            }
                            res.send({
                                "success": false
                            })
                            return
                        }
                    })


                }
            })
        } else {
            res.send({
                "success": false
            })
            return
        }

    })

})

app.post('/api/create-user', (req, res) => {
    var userFirstName = req.body.txtFirstName
    var userLastName = req.body.txtLastName
    var userEmail = req.body.txtEmail.toLowerCase()
    var userPassword = req.body.txtPassword

    console.log(userFirstName, userLastName, userEmail, userPassword)
    var sqlQuery = `insert into Users (firstName, lastName, email, password) 
                    values ("${userFirstName}", "${userLastName}", "${userEmail}", "${userPassword}" )`

    connection.query(sqlQuery, (err, result) => {
        if (err) {
            res.send(false)
            console.log('There was an error inserting ')
            return;
        }
        req.session.userId = result.insertId;
        res.send(true)
    })
})

app.get('/api/logout', (req, res, next) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                res.send(false)
                return next(err)
            } else {
                res.send(true)
            }
        })
    }
})

setInterval(function () {
    connection.query('SELECT 1')
}, 5000)



app.listen(port, () => {
    console.log('runnin on port ' + port)
})