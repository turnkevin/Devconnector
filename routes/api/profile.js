const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const request = require("request");
const config = require("config");

//@route   GET api/profile
//@desc    Test route
//@access Public
// router.get("/", (req, res) => res.send("Profile route"));

/**
 * @route GET api/profile/me
 * @desc get current user profile
 * @access private
 */
router.get("/me", auth, async (req, res) => {
  try {
    //req.user.id from middleware auth
    const profile = await Profile.findOne({ user: req.user.id })
      //populate name, avatar fields from users collection (defined in User schema) to collection profiles
      .populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "there is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

/**
 * @route POST api/profile
 * @desc create or update user profile
 * @access private
 */
router.post(
  "/",
  [
    //three middlewares in an array
    auth,
    check("status", "status is required").not().isEmpty(),
    check("skills", "skills is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //errors.array() => list each error obj in an array
      return res.status(400).json({ errors: errors.array() });
    }

    // destructure the request
    const {
      company,
      location,
      bio,
      status,
      githubUsername,
      website,
      skills,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      // spread the rest of the fields we don't need to check
      // ...rest
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubUsername) profileFields.githubUsername = githubUsername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }
    // console.log(profileFields.skills)
    // res.send('hello')

    // Build social object
    //should declare profileFields.social as an obj first, otherwise it is undefined
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id }); //req.user.id comes from token in auth middleware
      if (profile) {
        //update existing profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields }, //replace the entire profile with the updated one by $set
          { new: true } //new true => enable return a updated profile
        );
        return res.json(profile);
      }
      //create a new profile
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.err(err.message);
      res.status(500).send("server error");
    }
  }
);

/**
 * @route GET api/profile
 * @desc get all profiles
 * @access public
 */
router.get("/", async (req, res) => {
  try {
    //将name, avatar field 以obj  形式作为profile的一个name field, field name 是 user (user model)
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

/**
 * @route GET api/profile/user/:user_id
 * @desc get profile by user id
 * @access public
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    // user_id from url
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile)
      return res.status(400).json({ msg: "There is no profile for this user" });

    res.json(profile);
  } catch (err) {
    console.error(err.message);

    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.status(500).send("server error");
  }
});

/**
 * @route POST api/profile
 * @desc create or update user profile
 * @access private
 */
router.post(
  "/",
  [
    //three middlewares in an array
    auth,
    check("status", "status is required").not().isEmpty(),
    check("skills", "skills is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //errors.array() => list each error obj in an array
      return res.status(400).json({ errors: errors.array() });
    }

    // destructure the request
    const {
      company,
      location,
      bio,
      status,
      githubUsername,
      website,
      skills,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      // spread the rest of the fields we don't need to check
      // ...rest
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubUsername) profileFields.githubUsername = githubUsername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }
    // console.log(profileFields.skills)
    // res.send('hello')

    // Build social object
    //should declare profileFields.social as an obj first, otherwise it is undefined
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id }); //req.user.id comes from token in auth middleware
      if (profile) {
        //update existing profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields }, //replace the entire profile with the updated one by $set
          { new: true } //new true => enable return a updated profile
        );
        return res.json(profile);
      }
      //create a new profile
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.err(err.message);
      res.status(500).send("server error");
    }
  }
);

/**
 * @route DELETE api/profile
 * @desc delete profile, user & posts
 * @access private
 */
router.delete("/", auth, async (req, res) => {
  try {
    //remove user profile from profiles collection
    await Profile.findOneAndRemove({ user: req.user.id }); ////req.user.id from auth middleware
    //remove user from users collection
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "user deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

/**
 * @route PUT api/profile/experience
 * @desc add profile experience
 * @access private
 */
router.put(
  "/experience",
  [
    auth,
    check("title", "title is required").not().isEmpty(),
    check("company", "company is required").not().isEmpty(),
    check("from", "from date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, company, location, from, to, current, description } =
      req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.err(err.message);
      res.status(500).send("server error");
    }
  }
);

/**
 * @route DELETE api/profile/experience/:exp_id
 * @desc delete experience from profile
 * @access private
 */
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get remove index
    // ['_id1','_id2', ...].indexOf('_id1') => 0
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

/**
 * @route PUT api/profile/education
 * @desc add profile education
 * @access private
 */
router.put(
  "/education",
  [
    auth,
    check("school", "school is required").not().isEmpty(),
    check("degree", "degree is required").not().isEmpty(),
    check("fieldOfStudy", "field of study is required").not().isEmpty(),
    check("from", "from date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { school, degree, fieldOfStudy, from, to, description } = req.body;

    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.err(err.message);
      res.status(500).send("server error");
    }
  }
);

/**
 * @route DELETE api/profile/education/:edu_id
 * @desc delete education from profile
 * @access private
 */
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get remove index
    // ['_id1','_id2', ...].indexOf('_id1') => 0
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

/**
 * @route GET api/profile/github/:username
 * @desc get user repos from github
 * @access public
 */
router.get("/github/:username", async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );

    const headers = {
      "user-agent": "node.js",
      Authorization: `token ${config.get("githubToken")}`,
    };

    const gitHubResponse = await axios.get(uri, { headers });

    return res.json(gitHubResponse.data);
  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: "No Github profile found" });
  }
});

/** UPDATE EXPERIENCE */

module.exports = router;
