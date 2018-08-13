require('dotenv').config()
const express             = require('express'),
    mongoose              = require('mongoose'),
    flash                 = require('connect-flash'),
    passport              = require('passport'),
    bodyParser            = require('body-parser'),
    LocalStrategy         = require('passport-local'),
    GitHubStrategy        = require('passport-github'),
    methodOverride        = require('method-override'),
    expressSession        = require('express-session'),
    cookieParser          = require('cookie-parser'),
    expressSanitizer      = require('express-sanitizer'),
    User                  = require('./models/user');


const app = express();

const PORT = process.env.PORT || 7000;

//Routes Imports
const authentication = require('./routes/authentication');
const bars           = require('./routes/venues');


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGOLAB_CHARCOAL_URI || 'mongodb://localhost/nightlife', {
  keepAlive: true
});

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method')); //this is for delete
app.use(flash());
app.use(expressSanitizer());
app.use(cookieParser());

// PASSPORT CONFIGURATION
app.use(require('express-session')({
   secret: 'does not matter',
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
app.use(bars);

//Server Setup
app.listen(PORT, () => {
  console.log(`NightLife server starting on ${PORT}`);
})

