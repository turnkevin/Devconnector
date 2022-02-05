const express = require('express')
const router = express.Router()
//package for validate user input and report error before creating an user
const { check, validationResult } = require('express-validator')
//bring user model
const User = require("../../models/User")
const config = require("config")
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


/** For testing  */
//@route   GET api/users
//@desc    Test route
//@access Public
router.get("/", (req, res) => res.send('User route'))

/** user registration route */
//@route   POST api/users
//@desc    User registration
//@access Public
router.post("/", [
    //name should not be empty
    check('name', 'name is required').not().isEmpty(),
    check('email', 'please include a valid email').isEmail(),
    check('password', 'Please enter a password with at least 6 characters').isLength({min:6})
], async (req, res) => {
    // console.log(req.body)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body

    try {
      //see if user exists
        let user = await User.findOne({ email: email })
        
        if (user) {
            return res.status(400).json({ errors: [ { msg: 'User already exists' } ] } )
        }
      //get users gravatar
        const avatar = gravatar.url(email, {
            s: '200', //size
            r: 'pg', //rating
            d: 'mm' //default
        })
        
        //create a user instance
        user = new User({
            name,
            email,
            avatar,
            password
        })

        // generate salt for password which need to be encrypted
        const salt = await bcrypt.genSalt(10)

      // encrypt password => hash password
        user.password = await bcrypt.hash(password, salt)

        //save user to mongoDB
        const result = await user.save()

        // console.log(user.id) // 相当于 result.id

        // res.send(`User ${user.id} registered`)

      //return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err
                //send token json format to browser
                res.json({ token })
        })
        
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server error')
    }
   
});

module.exports = router