const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = 5000;

mongoose.connect(
  //use localhost:27017 if 127.0.0.1:27017 is not working
  "mongodb://127.0.0.1:27017/discussionDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("successfully connected to mongo 127.0.0.1:27017");
    }
  }
);

const postsRoute = require("./routes/Posts");

app.use("/posts", postsRoute);

app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});

module.exports = app;
