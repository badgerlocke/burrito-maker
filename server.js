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
const ingredients = {
    "carbs": ["white rice","brown rice","black beans","pinto beans"],
    "protein": ["chicken","beef","pork","tofu","seitan"],
    "vegetables": ["onions","peppers","corn","broccoli","peas","carrots","avocado","zucchini"],
    "extras": ["cheese","queso","pico de gallo","salsa","mild sauce","guacamole","fire sauce","sour cream","chips"]
}

const cursedIngredients = ["ice cubes","nylon","diced plastic","bin juice","milk","a used sock","grated rubber","soap","Axe body spray","a whole lemon","mustard","super glue", "a sense of regret", "apple seeds","mold","tire sealant","scraps of denim","stained underwear","laxatives","lawn clippings","nicotine","Monster energy"]
//const blursed = ["a free curly fry","an onion ring","an enticing aroma","true happiness"]

const allIngredients = []
for (a in ingredients) {
    for (let i=0;i<ingredients[a].length;i++) {
        allIngredients.push(ingredients[a][i]);
    }
}

app.listen((process.env.PORT || 3000), () => {
    console.log(`listening on ${process.env.PORT}`)
})

MongoClient.connect(process.env.SERVER)
    .then(client => {
        console.log('Connected to database')
        const db = client.db('burrito-maker')
        const burritoesCollection = db.collection('burritoes')

        //Sends "burritoes" array to index.ejs and renders it 
        app.get('/', (req, res) => {
            burritoesCollection.find().toArray()
                .then(results => {
                    res.render('index.ejs', {burritoes: results}) 
                })
                .catch(error => console.error(error))
        })

        app.get('/order', (req, res) => {
            burritoesCollection.find().toArray()
                .then(results => {
                    res.render('order.ejs', {burrito: results[results.length-1]}) 
                })
                .catch(error => console.error(error))
        })

        app.get('*', (req,res) => {
            burritoesCollection.find().toArray()
                .then(results => {
                    res.render(path.join(__dirname, 'index.ejs'), {burritoes: results}) 
                })
                .catch(error => console.error(error))
        })

        app.post('/burritoes', (req,res) => {
            let newBurrito = makeBurrito(req.body)
            burritoesCollection.insertOne(newBurrito)
                .then(result => {
                    res.render('order',{burrito: newBurrito})
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
            }
            )

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
        numIngredients: data.numIngredients,
        orderNum: generateOrderNumber(),
        cursed: data.cursed === 'on' ? true : false,
        version: 1
    }
    console.log(newBurrito.orderNum)
    //Check if numIngredients is larger than the max value. If it is, set it to the max value.
    if (newBurrito.cursed && newBurrito.numIngredients > (allIngredients.length + cursedIngredients.length)) {
        newBurrito.numIngredients = (allIngredients.length + cursedIngredients.length);
    } 
    if (!newBurrito.cursed && newBurrito.numIngredients > allIngredients.length) {
        newBurrito.numIngredients = allIngredients.length;
    }
    newBurrito.ingredients = randomIngredients(newBurrito.numIngredients,newBurrito.cursed)
    return newBurrito;
}

function randomIngredients(num,cursed) {
    let selection = [...allIngredients]
    cursed ? selection = [...allIngredients,...cursedIngredients] : selection = [...allIngredients]
    let picks = []
    for (let i=0;i<num;i++) {
        let n=Math.floor(Math.random()*selection.length)
        picks.push(selection[n])
        selection.splice(n,1);
    }
    return picks;
}

function generateOrderNumber() {
    return String(Math.floor(10000000*Math.random()))
}

// app.get('/', (res,req,next) => {
//     res.statusCode(200).send("GET recieved")
// })

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../index.html'));
//   });