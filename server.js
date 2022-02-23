const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const { Schema } = mongoose
const URI = 'mongodb+srv://juanelcol:c4qwp2@cluster0.a47av.mongodb.net/user_db?retryWrites=true&w=majority'

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(express.json())

mongoose.connect(URI, {useNewUrlParser: true, useUnifiedTopology: true}, ()=> {console.log("Connected to database")})

const userSchema = new Schema({ 
  'username': String
})

const exerciseSchema = new Schema({
  'username': String,
  'description': String,
  'duration': Number,
  'date': Date
})

const logSchema = new Schema({
  'username': String,
  'count': Number,
  'log': Array
})

const User = mongoose.model('userInfo', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)
const Log = mongoose.model('log', logSchema)

app.get('/', (req, res)=>{
  res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/users', (req, res)=>{
  User.find({'username': req.body.username}, (err, userData)=>{
    if(err){
      console.log("Error:" + err)
    }else{
      if(userData.length == 0){
        const test = new User({
          '_id': req.body.id,
          'username': req.body.username
        })

      test.save((err,data)=>{
        if(err){
          console.log("Error:" + err)
        }else{
          res.json({
            '_id': data.id,
            'username': data.username
          })
        }
      })

      }else{
        res.send("Usuário já existe")
      }
    }
  })
})

app.get('/api/users', (req, res)=>{
  User.find({}, (err, userData)=>{
    if(err){
      res.send("error:" + err)
    }else{
      res.json(userData)
    }
  })
})

app.post('/api/users/:_id/exercises', (req, res)=>{
  let idJson = {'id': req.params._id}
  let checkedDate = new Date(req.body.date)
  let idToCheck = idJson.id
  let noDateHandler = ()=>{
    if(checkedDate instanceof Date && !isNaN(checkedDate)){
      return checkedDate
    }else{
      checkedDate = new Date()
    }
  }
  User.findById(idToCheck, (err, data)=>{
    if(err){
      console.log('error:' + err)
    }else{
      const test = new Exercise({
        'username': data.username,
        'description': req.body.description,
        'duration': req.body.duration,
        'date': checkedDate.toDateString()
      })
      test.save((err, data)=>{
        if(err){
          console.log('error:' + err)
        }else{
          console.log('exercício salvo com sucesso')
          res.json({
            '_id': idToCheck,
            'username': data.username,
            'description': data.description,
            'duration': data.duration,
            'date': data.date.toDateString()
          })
        }
      })
    }
  })
})

app.get('/api/users/:_id/logs', (req, res)=>{
  const {from, to, limit} = req.query
  let idJson = {"id": req.params._id}
  let idToCheck = idJson.id
  //console.log(idToCheck)
  User.findById(idToCheck, (err, data) => {
    var query = {
      username: data.username
    }
    //console.log(query)
    if (from !== undefined && to === undefined) {
      query.date = { $gte: new Date(from)}
    } else if (to !== undefined && from === undefined) {
      query.date = { $lte: new Date(to)}
    } else if (from !== undefined && to !== undefined) {
      query.date = { $gte: new Date(from), $lte: new Date(to)}
    }

    let limitChecker = (limit) => {
      let maxLimit = 100
      if (limit) {
        return limit
      }else {
        return maxLimit
      }
    }

    if (err) {
      console.log("error" + err)
    } else {
      Exercise.find((query), null, (limitChecker(+limit), (err, docs) => {
          let loggedArray = []
          if(err) {
            console.log('error' + err)
          } else {
            let documents = docs
            let loggedArray = documents.map((item) => {
              return {
                'description': item.description,
                'duration': item.duration,
                'log': item.date.toDateString()
              }
            })

            const test = new Log({
              'username': data.username,
              'count': loggedArray.length,
              'log': loggedArray
            })

            test.save((err, data)=> {
              if(err){
                console.log("error" + err)
              }else {
                res.json({
                  '_id': idToCheck,
                  'username': data.username,
                  'count': data.count,
                  'log': loggedArray
                })
              }
            })
          }
      }))
    }

  })
})

const listener = app.listen(8000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
