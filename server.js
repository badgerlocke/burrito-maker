//TODO: Validate user inputs
//      Figure out why update doesn't work on firefox
//      Add 'back' button to order page

const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true}))
app.use(bodyParser.json())
app.set('view engine', 'ejs')
// import ingredients from './ingredients.json' assert {type: 'json'}
//TODO: Move these into their own file
const ingredientsList = ["white rice","brown rice","black beans","pinto beans","chicken","beef","pork","steak","fish","tofu","seitan","onions","peppers","corn","broccoli","peas","carrots","avocado","zucchini","cheese","queso","pico de gallo","salsa","mild sauce","guacamole","fire sauce","sour cream","chips"]

const cursedIngredients = ["ice cubes","nylon","diced plastic","bin juice","milk","a used sock","grated rubber","soap","Axe body spray","a whole lemon","mustard","super glue", "a sense of regret", "apple seeds","mold","tire sealant","scraps of denim","stained underwear","laxatives","lawn clippings","nicotine","Monster energy"]

app.listen((process.env.PORT || 3000), () => {
    console.log(`listening on ${process.env.PORT}`)
})

MongoClient.connect(process.env.SERVER)
    .then(client => {
        console.log('Connected to database')
        const db = client.db('burrito-maker')
        const burritoesCollection = db.collection('burritoes')

        //Get all orders from the burrito DB. Convert to an array, then
        //send array to be rendered with 'index.ejs '
        app.get('/', (req, res) => {
            burritoesCollection.find().toArray()
                .then(burritoes => {
                    res.render('index.ejs', {burritoes: burritoes}) 
                })
                .catch(error => console.error(error))
        })
        //Displays most recent order (last element in the database)
        app.get('/order', (req, res) => {
            burritoesCollection.find().toArray()
                .then(results => {
                    res.render('order.ejs', {burrito: results[results.length-1]}) 
                })
                .catch(error => console.error(error))
        })

        //Makes a new burrito when a post request is received
        app.post('/burritoes', (req,res) => {
            let burrito = new Burrito(req.body)
            burritoesCollection.insertOne(burrito)
                .then(result => {
                    res.render('order',{burrito: burrito})
                })
                .catch(error => console.log(error))
        })

        //PUT request with order number => Find order in DB, use its data (cursed, numIngredients) to generate a new ingredients list, then update the order in the DB
        app.put('/burritoes', (req, res) => {
            const order = burritoesCollection.findOne({orderNum: req.body.orderNum})
            .then( data => {
                burritoesCollection.findOneAndUpdate(
                    {orderNum: req.body.orderNum},
                    {$set: {ingredients: randomIngredients(data.numIngredients,data.cursed)}},
                    { upsert: true}
                )
                    .then(result => {
                        return res.json('Updated!')
                    })
                    .catch(error => console.error(error))
            })
          })
        
        app.delete('/burritoes', (req, res) => {
            burritoesCollection.deleteOne(
              { orderNum: req.body.orderNum }
            )
              .then(result => {
                  if (result.deletedCount === 0) {
                      return res.json('No order to delete')
                  }
                res.json(`Burrito deleted`)
              })
              .catch(error => console.error(error))
          })
    })
    .catch(error => console.error(error))

//Chooses ingredients randomly from list(s). Duplicates not allowed
function randomIngredients(num,cursed) {
    let selection = []
    cursed ? selection = [...ingredientsList,...cursedIngredients] : selection = [...ingredientsList]
    let picks = []
    for (let i=0;i<num;i++) {
        let n=Math.floor(Math.random()*selection.length)
        picks.push(selection[n])
        selection.splice(n,1);
    }
    return picks;
}



class Burrito{
    constructor(data){
            this.name = data.name;
            this.generateOrderNumber();
            this.cursed = Boolean(data.cursed);
            this.checkLength(data.numIngredients);
            this.version = 1
            this.ingredients = randomIngredients(this.numIngredients,this.cursed)
    }
    //Generates a 9-digit order number. TODO: check for duplicates in db
    generateOrderNumber() {
        this.orderNum = String(Math.floor(10000000*Math.random()))
    }
    //Check if numIngredients is more than are available. If so, set to max ingredients.
    checkLength(length, cursed) {
        this.maxLength = this.cursed ? (ingredientsList.length + cursedIngredients.length) : ingredientsList.length;
        length > this.maxLength ? this.numIngredients = this.maxLength : this.numIngredients = length
    }


}

// let newb = new Burrito({name: 'Alfredo', numIngredients: 51, cursed: 'false'})
// console.log(newb)
