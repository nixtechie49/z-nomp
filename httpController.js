const level = require('level')
// Create our database
// This will create or open the underlying LevelDB store.
var db = level('./masf-entries-db')

const express = require('express')
const app = express()

var saveEntry = function(req, res) {
    // See if ip already logged; only log once (?)
    db.get(req.ip, function (err, value) {
      if (err.notFound) {
        var now = Date.now()
        db.put(req.body.ip, now, function(err) {
          if (err) return console.log('I/O Error!', err)
          let o = {ip: req.body.ip, date: now}
          console.log('New User - ', o)
          return res.send(o)
        })
        return res.status(500).send({err: err})
      }

      return res.status(500).send({err: err})
    })
}
app.post('/saveEntry', saveEntry) 

app.listen(3000, () => console.log('Express App listening on port 3000!'))


