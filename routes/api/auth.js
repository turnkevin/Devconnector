const express = require("express");
const router = express.Router();
//bring in auth middleware
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs')

/** 
@route   GET api/auth
@desc    Test route
@access Public */

//protect route, only accessible if user has token (registered user)
/**  router.get("/", auth, (req, res) => res.send("Auth route")); */

router.get("/", auth, async (req, res) => {
    try {
        //select('-password') => excludes 'password' field of user schema, only returns
        // other fields
        const user = await User.findById(req.user.id).select('-password')
        return res.json(user)
    } catch (err) {
        console.err(err.message)
        res.status(500).send('server error')
    }
});

/** 
 * @route POST api/auth
 * @desc authenticate user & get token
 * @access public
 */
router.post(
  "/",
  [
    check("email", "please include a valid email").isEmail(),
    check("password", "password is required").exists(),
  ],
  async (req, res) => {
    // console.log(req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {email, password } = req.body;

    try {
      //see if user exists
      let user = await User.findOne({ email: email });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: "invalid credentials" }] });
      }

			//compare plainText input password with user.encrypted password
			const isMatch = await bcrypt.compare(password, user.password)
        
      if (!isMatch) {
				return res.status(400).json({ errors: [{ msg: "invalid credentials" }] });
      }   
      
      //return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

			jwt.sign(payload,
				config.get("jwtSecret"),
				{ expiresIn: 360000 },
				(err, token) => {
        if (err) throw err;
        res.json({ token });
				});
			
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
