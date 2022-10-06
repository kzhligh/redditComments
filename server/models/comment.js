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

//-------------------------------COMMENT MODEL-------------------------------//

//Comment schema. Represents comment made on parent post/discussion, and comments on comments.
//Requires a username to indicate who made the post.
//Requires the comment itself for the post.
const commentSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    comment: { type: String, required: true },
    //Use population. comments array will store id's of comments similar to concept of foreign keys.
    //references Comment schema
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  //Display when the comment was createdAt + updatedAt
  { timestamps: true }
);

//Always (recursively) populate the comments field for comments themselves
commentSchema
  .pre("findOne", autoPopulateComments)
  .pre("find", autoPopulateComments);

//Create Comment model using commentSchema
const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
