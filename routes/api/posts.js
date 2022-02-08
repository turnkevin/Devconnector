const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");

/**@route   GET api/posts
@desc    Test route
@access Public */
// router.get("/", (req, res) => res.send("Posts route"));

/** @route POST api/posts
 * @desc Create a post
 * @access private
 */
router.post(
  "/",
  [auth, check("text", "text is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      //req.user.id === decoded.user.id
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text, //postman => req.body
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("server error");
    }
  }
);

/** @route GET api/posts
 * @desc get all posts
 * @access private
 */
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

/** @route GET api/posts/:post_id
 * @desc get post by post_id
 * @access private
 */
router.get("/:post_id", auth, async (req, res) => {
  try {
    const postId = req.params.post_id;

    //mongoose method Post.findById return a promise. if that promise is the rejection promise, then the error will be propagated to the catch block
    const post = await Post.findById(postId);

    //when postId is formatted as ObjectId structure (与objectId 的位数相同)
    if (!post) {
      return res.status(404).json({ msg: "post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);

    // if post_id is invalid format ObjectId (id少一位，多一位，都是invalid)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "post not found" });
    }

    res.status(500).send("server error");
  }
});

/** @route DELETE api/posts/:post_id
 * @desc delete post by post_id
 * @access private
 */
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "post is not found" });
    }

    //make sure only user who created the post at the first place can delete that post
    //post.user is the objectId
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "user not authorized" });
    }

    await post.remove();

    res.json({ msg: "post removed" });
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "post is not found" });
    }

    res.status(500).send("server error");
  }
});

/** @route PUT api/posts/like/:id
 * @desc like a post
 * @access private
 */
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "post is not found" });
    }

    //check if the post has already been liked
    //filter out one user's like
    const postByUserLength = post.likes.filter(
      (like) => like.user.toString() === req.user.id
    ).length;

    if (postByUserLength > 0) {
      return res.status(400).json({ msg: "post already liked" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "post is not found" });
    }

    res.status(500).send("server error");
  }
});

/** @route PUT api/posts/unlike/:post_id
 * @desc unlike a post
 * @access private
 */
router.put("/unlike/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "post is not found" });
    }

    const likesByUserLength = post.likes.filter(
      (like) => like.user.toString() === req.user.id
    ).length;

    // check if the post has been liked
    if (likesByUserLength === 0) {
      return res.status(400).json({ msg: "post has not yet been liked" });
    }

    //get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "post is not found" });
    }

    res.status(500).send("server error");
  }
});

/** @route POST api/posts/comment/:post_id
 * @desc comment on a post
 * @access private
 */
router.post(
  "/comment/:post_id",
  [auth, check("text", "text is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      //req.user.id === decoded.user.id
      const user = await User.findById(req.user.id).select("-password");

      const post = await Post.findById(req.params.post_id);

      if (!post) {
        return res.status(404).json({ msg: "post is not found" });
      }

      const newComment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);

      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "post is not found" });
      }

      res.status(500).send("server error");
    }
  }
);

/** @route DELETE api/posts/comment/:post_id/:comment_id
 * @desc delete a comment of a post by post_id and comment_id
 * @access private
 */
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "post not found" });
    }

    //pull out comment from that post
    //find method js
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    //make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "comment does not exist" });
    }

    //check user =>  only user who made a comment can delete that
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "user not authorized" });
    }

    //remove comment
    await comment.remove();

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "post not found" });
    }

    res.status(500).send("server error");
  }
});

module.exports = router;
