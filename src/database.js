const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://admin:1234@cluster0.rcj2pgu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

module.exports = { client };