const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
//http://localhost:5000/json?email=almubin78@gmail.com
//http://localhost:5000/json?email=mohosina107@gmail.com
//http://localhost:5000/json?email=mubinmim107@gmail.com
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@assignment-12.cotcugk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyToken(req,res,next){
    const authHeader = req.headers.authorization;
    console.log('authHeader',authHeader);
    if(!authHeader){
        return res.status(401).send('unauthorized access')

    }
    const token = authHeader.split(' ')[1];
    console.log('verifyToken', token);
    jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){if(err){return res.status(403).send({message: 'forbidden access'})}req.decoded=decoded;next()})
}
async function run(){
    try{
        const sellerCollection = client.db("assignmentDatabase").collection("sellers");
        const customerCollection = client.db("assignmentDatabase").collection("customers");
        const sellPosts = client.db("assignmentDatabase").collection("madePostForSell");
        const tempProductCollection = client.db("assignmentDatabase").collection("tempProduct");

        app.get('/json',async(req,res)=>{
            const email =req.query.email;
            console.log(email);
            const query = {email:email};
            const user = await sellerCollection.findOne(query);
            if(!user){
                res.status(403).send({accToken:''})
            }
            const token = jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn:'7D'})
            return res.send({accToken: token})
        })
        app.post('/tempCollection',async(req,res)=>{
            const newData = req.body;
            const insertedData = await tempProductCollection.insertOne(newData);
            res.send(insertedData)
        })
        app.post('/users',async(req,res)=>{
            const newData = req.body;
            const insertedData = await sellerCollection.insertOne(newData);
            res.send(insertedData)
        })
        
        app.get('/tempCollection',async(req,res)=>{
            const query = {};
            const getPost = await tempProductCollection.find(query).toArray();
            res.send(getPost)
        })
        app.get('/sellers',async(req,res)=>{
            
            const getPost = await sellerCollection.find({role:'seller'}).toArray();
            res.send(getPost)
        })
        app.get('/allUsers',async(req,res)=>{
            const query = {}
            const getPost = await sellerCollection.find(query).toArray();
            res.send(getPost)
        })
        app.get('/category',async(req,res)=>{
            const query = {}
            const getPost = await sellerCollection.find(query).toArray();
            res.send(getPost)
        })
        app.post('/post',async(req,res)=>{
            const newPost = req.body;
            const getPost = await sellPosts.insertOne(newPost);
            res.send(getPost)
        })

        app.put('/allUsers/verified/:id',async(req,res)=>{
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
        
        
    }
    finally{

    }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('Server side running')
});

app.listen(port, () => {
    console.log('Last Assignment in Progress, ', port);
})