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
const ingredientsList = ["white rice","brown rice","black beans","pinto beans","chicken","beef","pork","tofu","seitan","onions","peppers","corn","broccoli","peas","carrots","avocado","zucchini","cheese","queso","pico de gallo","salsa","mild sauce","guacamole","fire sauce","sour cream","chips"]


const cursedIngredients = ["ice cubes","nylon","diced plastic","bin juice","milk","a used sock","grated rubber","soap","Axe body spray","a whole lemon","mustard","super glue", "a sense of regret", "apple seeds","mold","tire sealant","scraps of denim","stained underwear","laxatives","lawn clippings","nicotine","Monster energy"]
//const blursed = ["a free curly fry","an onion ring","an enticing aroma","true happiness"]


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

        //I don't think this is needed; added when having issues with Heroku
        // app.get('*', (req,res) => {
        //     burritoesCollection.find().toArray()
        //         .then(results => {
        //             res.render(path.join(__dirname, 'index.ejs'), {burritoes: results}) 
        //         })
        //         .catch(error => console.error(error))
        // })

        //Makes a new burrito when user makes a post request
        app.post('/burritoes', (req,res) => {
            let newBurrito = makeBurrito(req.body)
            let burr = new Burrito(req.body)
            burritoesCollection.insertOne(burr)
                .then(result => {
                    res.render('order',{burrito: burr})
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

function makeBurrito(data) {
    let newBurrito = {
        name: data.name,
        numIngredients: checkLength(data.numIngredients,Boolean(data.cursed)),
        orderNum: generateOrderNumber(),
        cursed: Boolean(data.cursed),
        version: 1
    }
    newBurrito.ingredients = randomIngredients(newBurrito.numIngredients,newBurrito.cursed)
    return newBurrito;
}


//Check if numIngredients is more than are available. If so, set to max ingredients.
function checkLength(length, cursed) {
    if (cursed && length > (ingredientsList.length + cursedIngredients.length)) {
        return ingredientsList.length + cursedIngredients.length;
    } 
    if (!cursed && length > ingredientsList.length) {
        return ingredientsList.length;
    }
    return length;
}

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

//Generates a 9-digit order number. TODO: check for duplicates in db
function generateOrderNumber() {
    return String(Math.floor(10000000*Math.random()))
}

class Burrito{
    constructor(data){
            this.name = data.name;
            this.orderNum = generateOrderNumber();
            this.cursed = Boolean(data.cursed);
            this.numIngredients = checkLength(data.numIngredients,this.cursed);
            this.version = 1
            this.ingredients = randomIngredients(this.numIngredients,this.cursed)
        }
}

let newb = new Burrito({name: 'Alfredo', numIngredients: 5, cursed: 'false'})
console.log(makeBurrito({name: 'bob', numIngredients: 5, cursed: 'false'}))
console.log(newb)

console.log(newb.ingredients)