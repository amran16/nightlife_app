require('dotenv').config()
var express               = require("express"),
    mongoose              = require("mongoose"),
    passport              = require("passport"),
    bodyParser            = require("body-parser"),
    User                  = require("./models/user"),
    Yelpinfo              = require("./models/yelp"),
    Yelp                  = require("yelp"),
    LocalStrategy         = require("passport-local"),
    GitHubStrategy        = require("passport-github2"),
    googleStrategy        = require("passport-google-oauth"),
    passportLocalMongoose = require("passport-local-mongoose"),
    methodOverride        = require("method-override"),
    expressSession        = require("express-session"),
    cookieParser          = require("cookie-parser"),
    expressSanitizer      = require('express-sanitizer');


var app = express();

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/nightlife");

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method")); //this is for delete
app.use(expressSanitizer());
app.use(cookieParser());

//login in
app.use(expressSession({
   secret: "does not matter",
   resave: false,
   saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});


var yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMRER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token:          process.env.YELP_TOKEN,
  token_secret:    process.env.YELP_TOKEN_SECRET
});

// var yelp = new Yelp({
//   consumer_key: process.env.consumer_key,
//   consumer_secret: process.env.consumer_secret,
//   token:           process.env.token,
//   token_secret:     process.env.token_secret
// });

// var Consumer_Key     = "zfuCi2kimVFjKltA-Gpf8A";
// var Consumer_Secret	 = "vRXBlz8x35Jr2nmeX4W1pVq42QU";
// var Token            = "cSNei4kb4ZQK6i7fI2muwn4Qg4So5_-h";
// var Token_Secret     = "RfylnXvMpy5TdqV62KyOBCKoAX8";

//github login
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL:  'https://yelpcampsite.herokuapp.com/auth/callback'
 },
 function(accessToken, refreshToken, profile, done){
   User.findOne({ githubId: profile.username}, function(err, user){
     if(err){
       console.log(err);
     } else if(user === null){
       User.create({username: profile.username}, function(err, newUser){
         if(err){
           console.log(err);
         }else{
           return done(err, newUser);
         }
       });
     }else{
       return done(err, user);
     }
   });
 }
));



//============
// ROUTES
//============

app.get('/', function(req, res){
  res.redirect('/bars');
});

app.get('/bars', function(req, res){
  res.render('landing');
});

app.post('/bars', function(req, res){
    var location = req.body.location;
        location = req.sanitize(location);
        res.cookie('location', location);
    res.redirect('/bars/' + location);
})


app.get('/bars/:place', function(req, res){

   var place = req.params.place;

    yelp.search({
      term: 'bar',
      location: place
    }, function(err, data){
      if(err){
        console.log('Error');
      }else{

        Yelpinfo.find({}, function(err, bars){
          if(err){
            console.log(err);
          }else{
              res.render('list', {data: data, place: place, bars: bars});
          }

        });

        //console.log(data);
        //res.send(data.businesses[0]);
        //res.send(data.businesses);

          // businesses.snippet_text
          // businesses.phone
          // businesses.name
          // businesses.location.display_address[0]
          // businesses.location.address
          // businesses.mobile_url
    }
  });
 });


 // Auth Routes

 //show sign up form
 app.get("/register", function(req, res){
    res.render("register");
 });

 //handling user sign up
 app.post("/register", function(req, res){

     User.register(new User({username: req.body.username}), req.body.password, function(err, user){
         if(err){
             console.log(err);
             return res.render("register");
         }
         passport.authenticate("local")(req, res, function(){
            //res.send("you are in");
            res.redirect("/");
         });
     });
 });


 // LOGIN ROUTES
 //render login form
 app.get("/login", function(req, res){
    res.render("login");
 });

 //login logic
 app.post("/login", passport.authenticate("local",
     {
         successRedirect: "/",
         failureRedirect: "/login"
     }), function(req, res){
 });


 //GITHUB LOGIN
 app.get('/auth', passport.authenticate('github'));

 app.get('/auth/error', function(req, res){
   res.redirect('/register');
 });

 app.get('/auth/callback',
    passport.authenticate('github', { failureRedirect: '/auth/error'}),
    function(req, res){
      // Successful authentication, redirect home.
     res.redirect('/secret');
   }
 );


 ///LOGOUT Route
 app.get("/logout", function(req, res){
     req.logout();
     res.redirect("/");
 });


 //This is amiddleware to prevent going to secret without any logins
 function isLoggedIn(req, res, next){
     if(req.isAuthenticated()){
         return next();
     }
     res.redirect("/login");
 }





app.listen(7000, function(){
   console.log('The Night-Life Server is running on 7000');
});
