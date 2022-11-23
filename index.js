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

async function run(){
    try{
        const customerCollection = client.db("assignmentDatabase").collection("customers");
        
        
        
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