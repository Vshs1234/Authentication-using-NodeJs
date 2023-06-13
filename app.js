//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
// const encrypt=require("mongoose-encryption");
// const md5=require("md5");
const bcrypt=require("bcrypt");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate")

const saltRounds=10;

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(session({
    secret:"This is a little secret.",
    saveUninitialized:false,
    resave:false 
}));
app.use(passport.initialize());
app.use(passport.session());


//connecting to the database

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});
// mongoose.set("useCreateIndex",true);//in case of any warnings


//it has to be new mongoose becz we are using plugins
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});


const User=mongoose.model("User",userSchema);


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());//creates cookie
passport.deserializeUser(User.deserializeUser());//crumbles cookie


// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets",
//     userProfileURL:"http://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     console.log(profile);
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
    
//       return cb(err, user);
//     });
//   }
// ));

app.get('/',function(req,res){
    res.render('home');
});

app.get('/login',function(req,res){
    res.render('login');
});


// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile'] })
// );

// app.get('/auth/google/secrets', 
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/secrets');
//   });

app.post('/login',function(req,res){

    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
   
});

app.get("/logout", function(req, res) {
    req.logout(function(err) {
      if (err) {
        console.log(err);
      }
      res.redirect("/");
    });
  });

app.get('/register',function(req,res){
    res.render('register');
});

app.get('/secrets',function(req,res){
    User.find({"secret":{$ne : null}}).then(function(found){
        res.render("secrets",{found:found});
    })
});

app.get('/submit',function(req,res){
    if(req.isAuthenticated()){
        res.render('submit')
    }else{
        res.redirect('/login')
    }
})

app.post('/submit', function(req, res) {
    const submittedSecret = req.body.secret;
    console.log(submittedSecret);
    console.log(req.user.id);
  
    User.findById(req.user.id).then(function(foundUser) {
        console.log("shndfhsd");
        foundUser.secret = submittedSecret;
        foundUser.save().then(function() {
         
            res.redirect('/secrets');
          
        });
      
    });
  });
  

app.post('/register',function(req,res){

   User.register({username:req.body.username,secret:""},req.body.password,function(err,user){
    if(err){
        console.log(err);
        res.redirect("/register");
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    }
   });

    
});

app.listen(3000,function(){
    console.log("server running on port 3000.");
});







// login

// const username=req.body.username;

// const password=req.body.password;
// User.findOne({email:username}).then(function(foundUser){
//     if(foundUser){
//         bcrypt.compare(password,foundUser.password, function(err, result) {
//             // result == true
//             if(result===true){
//                 res.render('secrets');
//             }
//             else{
//                 console.log("not found due to wrong password");
//             }
//         });
//     }else{
//         console.log("not found");

//     }
// });


// register
// bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     // Store hash in your password DB.
//     const newUser=new User({
//         email:req.body.username,
//         password:hash
//      })
//      newUser.save().then(function(done){
//          if(done){
//             res.render('secrets');
            
//          }else{
//             res.send("not done") 
//          }
//      });
// });