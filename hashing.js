var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#€%&/()";
var config = require('./config')
var bcrypt = require('bcrypt')
var makeid = () => {
    var text = "";
  
    for (var i = 0; i < 45; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }

  module.exports = {
      createUniqueString : makeid,

      cryptPassword : (password, r_salt, callback) => {
        bcrypt.genSalt(10, (err, salt) => {
            if(err) {
                return callback(err);
            }
            bcrypt.hash(password + r_salt + config.peber, salt, (err, hash) => {
                return callback(err, hash);
            })
        })
    },
    comparePassword : (plainPass, hashword, callback) => {
        bcrypt.compare(plainPass+config.peber, hashword, (err, isPasswordMatch) => {
            if(err) {
                return callback(err)
            }
            return callback(null, isPasswordMatch)
        })
  }
}