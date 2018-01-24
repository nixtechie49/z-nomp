//TODO express
const level = require('level')

// Create our database
// This will create or open the underlying LevelDB store.
var db = level('./masf-entries-db')

//This needs to be a controller method inside express
exports.saveEntry = function(req, res) {
    // See if ip already logged ; only log once (?)
    db.get(req.ip, function (err, value) {
      if (err.notFound) {
        db.put(req.body.ip, Date.now(), function(err) {
          if (err) return console.log('Ooops!', err) // some kind of I/O error
          console.log('Yay timestamped: ', req.body.ip)
        })
        return res.status(500).send({err: err})
      }

      return res.status(500).send({err: err})
    })
}
