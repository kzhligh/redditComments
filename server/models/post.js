const express = require("express"); //api framework
const bodyParser = require("body-parser"); //parse incoming request bodies
const mongoose = require("mongoose"); //odm

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const Schema = mongoose.Schema;

//Recursively populate comments of each document.
//Essentially, this nests populate() calls.
function autoPopulateComments(next) {
  this.populate("comments");
  next();
}

//-------------------------------POST MODEL-------------------------------//

//Post schema (represents a discussion question. It is the parent/"starter" of a thread).
//Requires a username to indicate who made the post.
//Requires content for the post.
const postSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    content: { type: String, required: true },
    //Use population. comments array will store id's of comments similar to concept of foreign keys.
    //references Comment schema
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  //Display when the post was createdAt + updatedAt
  { timestamps: true }
);

//Always (recursively) populate the comments field for our posts
postSchema
  .pre("findOne", autoPopulateComments)
  .pre("find", autoPopulateComments);

//Create Post model using postSchema
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
