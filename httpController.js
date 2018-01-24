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
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

var saveEntry = (req, res) => {
    // See if ip already logged; only log once (?)
    db.get(req.body.ip, function (err, value) {
      if (!err) {
        console.log('IP already present - ', value)
	return res.sendStatus(204)
      } else if (err.notFound) {
        var now = Date.now()
        db.put(req.body.ip, now, function(err) {
          if (err) return res.status(500).send({err: 'I/O Error!'})
          let o = {ip: req.body.ip, date: now}
          console.log('New User - ', o)
          return res.send(o)
        })
      } else {
        return res.status(500).send({err: err})
      } 
    })
}
app.post('/entry', saveEntry)

app.listen(8000, () => console.log('Express App listening on port 8000!'))


