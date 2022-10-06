const chai = require("chai"); //assertion lib
const chaiHttp = require("chai-http");
const server = require("../index");
const Comment = require("../models/comment");
const Post = require("../models/post");

chai.should();
chai.use(chaiHttp);

//NTS: should probably extract common code for generating existing documents
//shorten to debug

describe("discussion questions API", function () {
  //number of root posts in db
  let numberOfPosts = 0;
  Post.find().count((err, count) => {
    numberOfPosts = count;
  });

  // test the root GET route
  describe("GET /posts", () => {
    it("It should GET all the posts and their children", (done) => {
      chai
        .request(server)
        .get("/posts")
        .end((err, response) => {
          response.should.have.status(200);
          response.body.should.be.a("array");
          response.body.length.should.be.eq(numberOfPosts);
          done();
        });
    });

    it("It should display a 404 status since mispelling the get route (/post instead of /posts)", (done) => {
      chai
        .request(server)
        .get("/post")
        .end((err, response) => {
          response.should.have.status(404);
          done();
        });
    });
  });

  // test POST a new post/discussion route
  describe("POST /posts", () => {
    //create a post
    const post = new Post({
      username: "Professor A",
      content: "How is everyone?",
    });

    it("It should POST a new post/discussion", (done) => {
      chai
        .request(server)
        .post("/posts")
        .send(post)
        .end((err, response) => {
          response.should.have.status(201);
          response.body.should.be.a("object");
          response.body.should.have.property("_id").eq(post._id.toString());
          response.body.should.have.property("username").eq("Professor A");
          response.body.should.have.property("content").eq("How is everyone?");
          response.body.should.have.property("createdAt");
          response.body.should.have.property("updatedAt");
          response.body.should.have.property("comments");
          response.body.comments.should.be.a("array");
          response.body.comments.should.be.empty;
          done();
        });

      after(() => {
        Post.findByIdAndRemove(post._id).then(() => {
          console.log("Deleted");
        });
      });
    });

    //create a post
    const secondPost = new Post({
      content: "How is everyone?",
    });

    it("It should NOT POST a new post/discussion without the username property", (done) => {
      chai
        .request(server)
        .post("/posts")
        .send(secondPost)
        .end((err, response) => {
          response.should.have.status(400);
          response.body.should.be.a("Object");
          response.body.should.have
            .property("Message")
            .eq("Something's missing");
          done();
        });
    });
  });

  // test GET post by id route
  describe("GET /posts/:postId", () => {
    it("It should GET the post specified by postId with its children", (done) => {
      //generate a random post
      let postId = "";
      Post.find().count((err, count) => {
        var random = Math.floor(Math.random() * count);
        Post.findOne()
          .skip(random)
          .exec((err, result) => {
            postId = result._id.toString();

            //test using randomly generated post
            chai
              .request(server)
              .get("/posts/" + postId)
              .end((err, response) => {
                response.should.have.status(200);
                response.body.should.be.a("object");
                response.body.should.have.property("_id").eq(postId);
                response.body.should.have
                  .property("username")
                  .eq(result.username);
                response.body.should.have
                  .property("content")
                  .eq(result.content);
                response.body.should.have.property("comments");
                response.body.comments.should.be.a("array");
                done();
              });
          });
      });
    });
  });

  // test GET comments by post id
  describe("GET /posts/:postId/comments", () => {
    it("It should GET the nested comments of a specified post (without the original post)", (done) => {
      //generate a random post
      Post.find().count((err, count) => {
        numberOfPosts = count;
        var random = Math.floor(Math.random() * count);
        Post.findOne()
          .skip(random)
          .exec((err, result) => {
            let postId = result._id.toString();
            //test using randomly generated post
            chai
              .request(server)
              .get("/posts/" + postId + "/comments")
              .end((err, response) => {
                response.should.have.status(200);
                response.body.should.be.a("array");
                response.body.length.should.be.eq(result.comments.length);
                done();
              });
          });
      });
    });
  });

  // test POST comments given a post id
  describe("POST /posts/:postId/comments", () => {
    it("It should POST a new comment to the parent post with postId", (done) => {
      //generate random existing post
      Post.find().count((err, count) => {
        numberOfPosts = count;
        var random = Math.floor(Math.random() * count);
        Post.findOne()
          .skip(random)
          .exec((err, result) => {
            let postId = result._id.toString();

            //create new comment to post
            const comment = new Comment({
              username: "StudentA",
              comment: "I am fine",
            });

            //test using randomly generated post and newly created comment
            chai
              .request(server)
              .post("/posts/" + postId + "/comments")
              .send(comment)
              .end((err, response) => {
                response.should.have.status(201);
                response.body.should.be.a("object");
                response.body.should.have.property("_id").eq(postId);
                response.body.comments.should.be.a("array");
                //check if last comment of the random post is indeed the new comment
                response.body.comments[
                  response.body.comments.length - 1
                ]._id.should.be.eq(comment._id.toString());
                done();
              });

            after(() => {
              Comment.findByIdAndRemove(comment._id).then(() => {
                console.log("Deleted");
              });
            });
          });
      });
    });
  });

  // test GET comments of a comment (given its id)
  describe("GET /posts/:commentId/comments/replies", () => {
    it("It should GET the nested comments of a specified comment (without the original comment)", (done) => {
      //Generate an existing comment
      Comment.find().count((err, count) => {
        var random = Math.floor(Math.random() * count);
        Comment.findOne()
          .skip(random)
          .exec((err, result) => {
            let commentId = result._id.toString();
            //test using randomly generated comment
            chai
              .request(server)
              .get("/posts/" + commentId + "/comments/replies")
              .end((err, response) => {
                response.should.have.status(200);
                response.body.should.be.a("array");
                //check length of comments array of the existing comment is equal to that of the response
                response.body.length.should.be.eq(result.comments.length);
                done();
              });
          });
      });
    });
  });

  // test POST comments to a comment (given its id)
  describe("POST /posts/:commentId/comments/new", () => {
    it("It should POST a new comment given an existing comment", (done) => {
      Comment.find().count((err, count) => {
        var random = Math.floor(Math.random() * count);
        Comment.findOne()
          .skip(random)
          .exec((err, result) => {
            let commentId = result._id.toString();

            //create new comment to post
            const comment = new Comment({
              username: "StudentB",
              comment: "I need an extension for the assignment",
            });

            //test using randomly generated post and newly created comment
            chai
              .request(server)
              .post("/posts/" + commentId + "/comments/new")
              .send(comment)
              .end((err, response) => {
                response.should.have.status(201);
                response.body.should.be.a("object");
                response.body.should.have.property("_id").eq(commentId);
                response.body.comments.should.be.a("array");
                //here need to check last comment
                response.body.comments[
                  response.body.comments.length - 1
                ]._id.should.be.eq(comment._id.toString());
                done();
              });

            after(() => {
              Comment.findByIdAndRemove(comment._id).then(() => {
                console.log("Deleted");
              });
            });
          });
      });
    });
  });
});
