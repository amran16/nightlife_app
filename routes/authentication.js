//
var express               = require("express"),
    router                = express.Router(),
    mongoose              = require("mongoose"),
    LocalStrategy         = require("passport-local"),
    flash                 = require("connect-flash"),
    passport              = require("passport"),
    User                  = require("../models/user"),
    passportLocalMongoose = require("passport-local-mongoose"),
    methodOverride        = require("method-override"),
    expressSession        = require("express-session"),
    cookieParser          = require("cookie-parser"),
    expressSanitizer      = require('express-sanitizer');


 // Auth Routes

 //show sign up form
 router.get("/register", function(req, res){
    res.render("register");
 });

 //handling user sign up
 router.post("/register", function(req, res){

     User.register(new User({username: req.body.username}), req.body.password, function(err, user){
         if(err){
             console.log(err);
             return res.render("register");
         }
         passport.authenticate("local")(req, res, function(){
            res.redirect("/");
         });
     });
 });


 // LOGIN ROUTES
 //render login form
 router.get("/login", function(req, res){
   res.render("login");
    //res.render("login", {message: "ERROR, MESSED IT UP!!"});
    //res.render("login", {message: req.flash("error")});
 });

 //login logic
 router.post("/login", passport.authenticate("local",
     {
         successRedirect: "/",
         failureRedirect: "/login"
     }), function(req, res){
 });


 //GITHUB LOGIN
 router.get('/auth', passport.authenticate('github'));

 router.get('/auth/error', function(req, res){
   res.redirect('/register');
 });

 router.get('/auth/callback',
    passport.authenticate('github', { failureRedirect: '/auth/error'}),
    function(req, res){
      // Successful authentication, redirect home.
    res.redirect('/');
   }
 );


 ///LOGOUT Route
 router.get("/logout", function(req, res){
     req.logout();
     res.redirect("/");
 });


 //This is amiddleware to prevent doing anything without any logins
 function isLoggedIn(req, res, next){
     if(req.isAuthenticated()){
         return next();
     }
     //req.flash("error", "You need to be logged in to do that");
     res.redirect("/login");
 }



module.exports = router;
