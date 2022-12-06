const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@assignment-12.cotcugk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    // console.log('authHeader',authHeader);

    if (!authHeader) {
        return res.status(401).send('unauthorized access')

    }
    const token = authHeader.split(' ')[1];

    // console.log('token by useing ##verifyToken::::::::', token);
    // console.log('####process.env.ACCESS_TOKEN:::::::::::::,',process.env.ACCESS_TOKEN)

    jwt.verify(token, process.env.ACCESS_TOKEN, function (TAL, MAL) {
        // console.log('###verifyToken Function ###err[TAL],decoded[MAL]::::::::::::',TAL,'DECODED',MAL);
        if (TAL) { 
            return res.status(403).send({ message: 'From verifyToken:forbidden access' }) 
        }
        req.decoded = MAL;
        // console.log('Final DECODED##',req.decoded);
        next()
    })
}
async function run() {
    try {
        const sellerCollection = client.db("assignmentDatabase").collection("sellers");
        const sellPosts = client.db("assignmentDatabase").collection("madePostForSell");
        ///////////////json route for useToken Hooks/////////////
        app.get('/json', async (req, res) => {
            const email = req.query.email;
            console.log('req.query.email#/json Route:::::::::DONE');
            const query = { email: email };
            console.log('OP: query = { email: email } #/json Route::::::::DONE:');
            const user = await sellerCollection.findOne(query);
            if (!user) {
                res.status(403).send({ accToken: '' })
            }
            console.log('process.env.ACCESS_TOKEN in #/json Route:::::::DONE:');
            const fireBasetoken = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7D' });
            console.log('fireBasetoken:::::jwt.sign(mail,randomToken,expDate)::::::');
            return res.send({ accToken: fireBasetoken })
        })
        /////////Verified Admin//////////
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            console.log('decodedEmail in verifyAdmin function',req.decoded);
            const query = { email: decodedEmail };
            const user = await sellerCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'verifyAdmin:forbidden access' })
            }
            next();
        }
        /////////Verified Admin//////////
        const verifySeller = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            console.log('decodedEmail in ##verifySeller function',decodedEmail);
            const query = { email: decodedEmail };
            const user = await sellerCollection.findOne(query);
            if (user?.role !== 'seller') {
                return res.status(403).send({ message: '###verifySeller:forbidden access' })
            }
            next();
        }
        //////////////////////
        
        app.post('/users', async (req, res) => {
            const newData = req.body;
            const insertedData = await sellerCollection.insertOne(newData);
            res.send(insertedData)
        })
        //get route based on email[person]
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await sellerCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await sellerCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' })
        })
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await sellerCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' })
        })

        app.get('/sellers', async (req, res) => {

            const getPost = await sellerCollection.find({ role: 'seller' }).toArray();
            res.send(getPost)
        })
        app.get('/buyer', async (req, res) => {

            const getPost = await sellerCollection.find({ role: 'buyer' }).toArray();
            res.send(getPost)
        })
        app.get('/allUsers', async (req, res) => {
            const query = {}
            const getPost = await sellerCollection.find(query).toArray();
            res.send(getPost)
        })
        app.get('/signleposts', async (req, res) => {
            
            const getPost = await sellPosts.find({isApproved : true}).toArray();
            res.send(getPost)
        })



        //Posts Routes      
        app.post('/posts', verifyToken,verifySeller,async (req, res) => {
            const newPost = req.body;
            const getPost = await sellPosts.insertOne(newPost);
            res.send(getPost)
        })
        app.get('/posts', async (req, res) => {
            const query = {};
            const allPosts = await sellPosts.find(query).toArray();
            res.send(allPosts);
        })
        app.get('/category/AntiquePhone', async (req, res) => {

            const getOneProduct = await sellPosts.find({ category: 'AntiquePhone' }).toArray();
            // console.log('getOneProduct',getOneProduct);
            res.send(getOneProduct)
        })
        app.get('/category/SmartPhone', async (req, res) => {

            const getOneProduct = await sellPosts.find({ category: 'SmartPhone' }).toArray();
            // console.log('getOneProduct',getOneProduct);
            res.send(getOneProduct)
        })
        app.get('/category/ButtonPhone', async (req, res) => {

            const getOneProduct = await sellPosts.find({ category: 'ButtonPhone' }).toArray();
            // console.log('getOneProduct',getOneProduct);
            res.send(getOneProduct)
        })
        // delete buyer
        app.delete('/buyer/:id',verifySeller,async(req,res)=>{
            const id = req.params.id;
            console.log();
            const filter = {_id:ObjectId(id)};
            const deletedId = await sellPosts.deleteOne(filter);
            res.send(deletedId)
        })

        //verified sell routes    
        app.put('/allUsers/verified/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verifiedSeller: true
                }
            }
            const result = await sellerCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.put('/advertise/approved/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isBooked: true
                }
            }
            const result = await sellPosts.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.delete('/deleteSeller/:id',verifyToken,verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const deletedId = await sellerCollection.deleteOne(query);
            res.send(deletedId)
        })
        app.delete('/posts/:id',verifyToken,verifySeller, async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const deletedId = await sellPosts.deleteOne(query);
            res.send(deletedId)
        })
        app.put('/posts/approved/:id', verifyToken,verifySeller,async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isApproved: true
                }
            }
            const result = await sellPosts.updateOne(filter, updatedDoc, options); //
            res.send(result);
        })
        

    }
    finally {

    }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('Server side running')
});

app.listen(port, () => {
    console.log('Assignment in Progress, ', port);
})