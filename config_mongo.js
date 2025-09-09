"use strict";
const mongoose = require('mongoose')
const AutoIncrementFactory = require('mongoose-sequence');
const username = "";
const password = "";
const database = "";
const URL = `mongodb+srv://${username}:${password}@clustervegas.ym3zd.mongodb.net/${database}?retryWrites=true&w=majority`;
const DB_OPTIONS = {

};

const connection = mongoose.createConnection(URL,DB_OPTIONS);
const AutoIncrement = AutoIncrementFactory(connection);


const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    const connect = await mongoose.connect(
      URL,
      DB_OPTIONS
    );
    console.log(`Connected to mongoDB Tracking Link`);
    return connect;
  } catch (error) {
    console.log('Cannot connect Tracking Link Server')
    process.exit(1);
  }
}



module.exports = {
  connectDB: connectDB,
  URL: URL,
  AutoIncrement:AutoIncrement
}
