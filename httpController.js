const level = require('level')
// Create our database
// This will create or open the underlying LevelDB store.
var db = level('./masf-entries-db')

var bodyParser = require('body-parser')
var cors = require('cors')
const express = require('express')
const app = express()

app.use(cors())
// parse application/json
app.use(bodyParser.json())

var saveEntry = function(req, res) {
    // See if ip already logged; only log once (?)
console.log(req.body)
    db.get(req.body.ip, function (err, value) {
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
app.post('/entry', saveEntry)

app.listen(8000, () => console.log('Express App listening on port 8000!'))


