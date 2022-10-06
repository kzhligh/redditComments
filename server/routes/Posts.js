const express = require("express"); //api framework
const bodyParser = require("body-parser"); //parse incoming request bodies
const mongoose = require("mongoose"); //odm
const Post = require("../models/post");
const Comment = require("../models/comment");
const fs = require("fs");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const router = express.Router();

//helper function to output tree .json file
function writeToOutput(output, fileName) {
  fs.writeFile(
    `output/${fileName}.json`,
    JSON.stringify(output),
    "utf8",
    (err) => err && console.error(err)
  );
}

//-------------------------------ROUTES FOR POSTS-------------------------------//

//Get route to fetch all our posts and their nested comments in a flat tree format.
router.get("/", (req, res) => {
  //Find all posts, and send them as json. Catch any error.
  //Note, they are ordered by createdAt in a descending manner. New posts show up at the top.
  Post.find({})
    .sort({ createdAt: -1 })
    .then((posts) => {
      writeToOutput(posts, "allDiscussions");
      res.status(200).json(posts);
    })
    .catch((err) => {
      console.log(err.message);
    });
});

//Post route to create one new post/start a discussion
router.post("/", (req, res) => {
  // a small validation check, to use JOI or something else eventually
  if (req.body.username === undefined || req.body.content === undefined) {
    //for testing purpose
    res.status(400).send({ Message: "Something's missing" });
  } else {
    //create new post
    const post = new Post(req.body);
    //save the post to db, send status and the created post
    post
      .save()
      .then((post) => res.status(201).json(post))
      .catch((err) => {
        console.log(err);
      });
  }
});

//Get route to fetch a specific post and its nested children
router.get("/:postId", (req, res) => {
  //Find the post, and send it along with its comments in json
  Post.findById(req.params.postId)
    .then((post) => {
      writeToOutput(post, "post");
      res.status(200).json(post);
    })
    .catch((err) => {
      console.log(err.message);
    });
});

//-------------------------------ROUTES FOR COMMENTS-------------------------------//

//Get route to view all comments available in the database in a flat tree for a given discussion (without original post)
router.get("/:postId/comments", (req, res) => {
  //Find the post, and send status and post comments in json
  Post.findById(req.params.postId)
    //.populate("comments")
    .then((post) => {
      writeToOutput(post.comments, "comments");
      res.status(200).json(post.comments);
    })
    .catch((err) => {
      console.log(err.message);
    });
});

//Post route to create a new comment given a post
router.post("/:postId/comments", (req, res) => {
  //Create new comment
  const comment = new Comment(req.body);
  //Save comment
  comment
    .save()
    .then(() => Post.findById(req.params.postId))
    .then((post) => {
      //Add a comment to the back of the comments array and save the post
      post.comments.push(comment);
      return post.save();
    }) //after that send status and the original post in order to see new comment is preppended to comments array
    .then((post) => res.status(201).json(post))
    .catch((err) => {
      console.log(err);
    });
});

//-------------------------------ROUTES FOR COMMENTS ON COMMENTS-------------------------------//

//Get route to view all comments given a comment (without original comment)
//note /replies is to differentiate from post routes in ROUTES FOR COMMENTS
//all comments on comments are considered to be "replies" to differentiate them from layer 1 comments of original posts
router.get("/:commentId/comments/replies", (req, res) => {
  Comment.findById(req.params.commentId)
    .then((parentComment) => {
      writeToOutput(parentComment.comments, "commentsOfcomment");
      res.status(200).json(parentComment.comments);
    })
    .catch((err) => {
      console.log(err);
    });
});

//Post route to create a new comment given an existing comment
//Note, /new here differentiates from ROUTES FOR COMMENT
router.post("/:commentId/comments/new", (req, res) => {
  //create new comment
  const newComment = new Comment(req.body);
  newComment
    .save()
    .then(() => Comment.findById(req.params.commentId))
    .then((parentComment) => {
      //add comment to comments array and save the parent comment
      parentComment.comments.push(newComment);
      return parentComment.save();
    }) //after that, send the parent comment
    .then((parentComment) => res.status(201).json(parentComment))
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
