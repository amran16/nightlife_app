require('dotenv').config()
var express               = require("express"),
    mongoose              = require("mongoose"),
    flash                 = require("connect-flash"),
    passport              = require("passport"),
    bodyParser            = require("body-parser"),
    User                  = require("./models/user"),
    YelpInfo              = require("./models/yelp"),
    Yelp                  = require("yelp"),
    LocalStrategy         = require("passport-local"),
    GitHubStrategy        = require("passport-github"),
    googleStrategy        = require("passport-google-oauth"),
    passportLocalMongoose = require("passport-local-mongoose"),
    methodOverride        = require("method-override"),
    expressSession        = require("express-session"),
    cookieParser          = require("cookie-parser"),
    expressSanitizer      = require('express-sanitizer');


var app = express();

//Routes Imports
var authentication = require('./routes/authentication')


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/nightlife");

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method")); //this is for delete
app.use(flash());
app.use(expressSanitizer());
app.use(cookieParser());

// PASSPORT CONFIGURATION
app.use(require("express-session")({
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
    //res.locals.error = req.flash("error");
    //res.locals.success = req.flash("success");
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
  callbackURL:  'https://nightlifeproject.herokuapp.com/auth/callback'

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


app.use(authentication);


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


// app.get('/bars/:place', function(req, res){
//
//    var place = req.params.place;
//
//     yelp.search({ term: 'bar', location: place })
//        .then(function(data){
//          //console.log(data);
//
//          YelpInfo.find({}, function(err, bars){
//            if(err){
//              console.log(err)
//            }
//            else {
//              //res.send(bars)  //[{"_id": "59156782a945605c79123943",
//                             //    "__v": 0,
//                             //"people": [
//                              //"5914c753a0c3a95546c8fd09"]
//                               //}, i have got 9 of those
//                               //]
//              //res.render('list', {data: data, place: place, bars: bars});
//              if(bars.length !== 0){
//                bars.forEach(function(bar){
//                  data.businesses.forEach(function(business){
//                    if(!business.going){
//                      business.going = [];
//                    }else if(bars.YelpId === business.id){
//                      business.going = bars.people;
//                    }
//                  })
//                })
//              }
//              else {
//                data.businesses.forEach(function(business){
//               business.going = [];
//               });
//              }
//            }
//            res.render('list', {data: data, place: place, bars: bars});
//          });
//
//        })
//        .catch(function(err){
//          console.error(err);
//          res.status(404).send('This place does not exist');
//        });
//
//
//         //console.log(data);
//           //res.send(data);
//         //res.send(data.businesses[0]);
//         //res.send(data.businesses);
//
//           // businesses.snippet_text
//           // businesses.phone
//           // businesses.name
//           // businesses.location.display_address[0]
//           // businesses.location.address
//           // businesses.mobile_url
//           // businesses.id
//
//         //res.render('list', {data: data, place: place, bars: bars});
//
//         //console.log(req.params);
//  });

app.get('/bars/:place', function(req, res){

  var place = req.params.place;
  yelp.search({
    term: 'bar',
    location: place
  }, function(err, data){
    //console.log(data)
    if(err){
      console.log(err);
    } else {
    YelpInfo.find({}, function(err, bars){
        if(err){
          console.log(err);
        } else {
          var business = data.businesses
          if(bars.length !== 0){
              for(var i = 0; i < bars.length; i++){
                for(var j = 0; j < business.length; j++){
                  if(!business[j].going){
                    business[j].going = [];
                  } else if(bars[i].YelpId === business[j].id){
                    business[j].going = bars[i].people;
                  }
                }
              }
          } else {
            for(var k = 0; k < business.length; k++){
              business[k].going = [];
            }
          }
        }
        res.render('list', {data: data, place: place, bars: bars});
        //res.send(data)
      });
    }
  });
});

 app.post('/bars/:place/:barId', isLoggedIn, function(req, res){
   //console.log(req.params);  //{ place: 'San Francisco', barId: 'abv-san-francisco-2' }
   //console.log(req.params.place)
   YelpInfo.findOne({YelpId: req.params.barId }, function(err, foundYelp){
     console.log(req.user)
     //console.log(req)
     if(foundYelp === null){
        YelpInfo.create({
          YelpId: req.params.barId,
          people: req.user._id
        }, function(err, savedYelp){
           if(err){
             console.log(err);
           }else{
             //req.flash("error", "You need to be logged in to do that");
             res.redirect('/bars/' + req.params.place);
           }
        })
     }else{
       //console.log(foundYelp);
       //console.log(req.user);
       foundYelp.people.push(req.user._id);
       foundYelp.save();
       //console.log(foundYelp);
       //req.flash("error", "You need to be logged in to do that");
       res.redirect('/bars/' + req.params.place);
     }

   });
 });

 app.delete('/bars/:place/:barId', isLoggedIn, function(req, res, next){
    YelpInfo.findOne({YelpId: req.params.barId}, function(err, foundYelp){
      if(err) return next (err);
      if(!err){
        //console.log(req.user._id);
        foundYelp.people.splice((foundYelp.people.indexOf(req.user._id)), 1);
        foundYelp.save();
        //console.log(foundYelp);
        res.redirect('/bars/' + req.params.place);
      }
    });
 });



 //
 // // Auth Routes
 //
 // //show sign up form
 // app.get("/register", function(req, res){
 //    res.render("register");
 // });
 //
 // //handling user sign up
 // app.post("/register", function(req, res){
 //
 //     User.register(new User({username: req.body.username}), req.body.password, function(err, user){
 //         if(err){
 //             console.log(err);
 //             return res.render("register");
 //         }
 //         passport.authenticate("local")(req, res, function(){
 //            //res.send("you are in");
 //            res.redirect("/");
 //         });
 //     });
 // });
 //
 //
 // // LOGIN ROUTES
 // //render login form
 // app.get("/login", function(req, res){
 //   res.render("login");
 //    //res.render("login", {message: "ERROR, MESSED IT UP!!"});
 //    //res.render("login", {message: req.flash("error")});
 // });
 //
 // //login logic
 // app.post("/login", passport.authenticate("local",
 //     {
 //         successRedirect: "/",
 //         failureRedirect: "/login"
 //     }), function(req, res){
 // });
 //
 //
 // //GITHUB LOGIN
 // app.get('/auth', passport.authenticate('github'));
 //
 // app.get('/auth/error', function(req, res){
 //   res.redirect('/register');
 // });
 //
 // app.get('/auth/callback',
 //    passport.authenticate('github', { failureRedirect: '/auth/error'}),
 //    function(req, res){
 //      // Successful authentication, redirect home.
 //    res.redirect('/');
 //   }
 // );
 //
 //
 // ///LOGOUT Route
 // app.get("/logout", function(req, res){
 //     req.logout();
 //     res.redirect("/");
 // });


 //This is amiddleware to prevent doing anything without any logins
 function isLoggedIn(req, res, next){
     if(req.isAuthenticated()){
         return next();
     }
     //req.flash("error", "You need to be logged in to do that");
     res.redirect("/login");
 }


app.listen(process.env.PORT || 7000, function(){
   console.log('The Night-Life Server is running on 7000');
});
