const { default: mongoose } = require("mongoose");
const mongodb = require("mongodb");
const userModule = require("../modules/user.module");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
module.exports={
    Login: async (req , res) =>{
        try {
            // Get user input
            const { email, password } = req.query;
        
            // Validate user input
            if (!(email && password)) {
              res.status(407).send("All input is required");
            }
            // Validate if user exist in our database
            const user = await userModule.findOne({ email });
        
            if (user && (await bcrypt.compare(password, user.password))) {
              // Create token
              const JWT_SECRET =
  "goK!pusp6ThEdURUtRenOwUhAsWUCLheBazl!uJLPlS8EbreWLdrupIwabRAsiBu";
              const token = jwt.sign(
                { user_id: user._id, email },
                JWT_SECRET,
              );
        
              // save user token
              user.token = token;
        
              // user
              res.status(200).json(user);
            }
            res.status(403).send("Invalid Credentials");
          } catch (err) {
            console.log(err);
          }
    },
    Register: async (req , res) =>{
        
        try {
            // Get user input
            const { email, password } = req.body;
        
            // Validate user input
            if (!(email && password )) {
              res.status(408).send("All input is required");
            }
            console.log("check 1 passed");
            // check if user already exist
            // Validate if user exist in our database
            const oldUser = await userModule.findOne({ email });
        
            if (oldUser) {
              return res.status(409).send("User Already Exist. Please Login");
            }
            console.log("check 2 passed");
            //Encrypt user password
            encryptedPassword = await bcrypt.hash(password, 10);
        
            // Create user in our database
            const user = await userModule.create({
              email: email.toLowerCase(), // sanitize: convert email to lowercase
              password: encryptedPassword,
            });
            console.log("user created");
        
            console.log("user id",user._id);
            const JWT_SECRET =
  "goK!pusp6ThEdURUtRenOwUhAsWUCLheBazl!uJLPlS8EbreWLdrupIwabRAsiBu";
            // Create token
            const token = jwt.sign(
              { user_id: user._id, email },
              JWT_SECRET,
            );
            
            // save user token
            user.token = token;
            console.log("token saved");
        
            // return new user
            res.status(200).json(user);
          } catch (err) {
            console.log(err);
          }
    },
}