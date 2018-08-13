const express = require('express'),
    router = express.Router(),
    yelp = require('yelp-fusion'),
    YelpInfo = require("../models/yelp");
   

const api_key = process.env.API_KEY;
const client = yelp.client(api_key);

router.get('/', function (req, res) {
    res.redirect('/bars');
});

router.get('/bars', function (req, res) {
    res.render('landing');
});

router.post('/bars', function (req, res) {
    var location = req.body.location;
    res.redirect('/bars/' + location);
})

router.get('/bars/:place', function (req, res) {

    var place = req.params.place;

    client.search({
        term: 'bar',
        location: place
    }).then(response => {
        //res.send(response.jsonBody.businesses);
        YelpInfo.find({}, (err, bars) => {
            if (err) {
                console.log(err);
            } else {
                var business = response.jsonBody.businesses;
                if (bars.length !== 0) {
                    for (var i = 0; i < bars.length; i++) {
                        for (var j = 0; j < business.length; j++) {
                            if (!business[j].going) {
                                business[j].going = [];
                            } else if (bars[i].YelpId === business[j].id) {
                                business[j].going = bars[i].people;
                            }
                        }
                    }
                } else {
                    for (var k = 0; k < business.length; k++) {
                        business[k].going = [];
                    }
                }
                //res.send(business)
                res.render('list', { place: place, bars: bars, business: business });

            }
        })

    }).catch(e => {
        console.log(e);
    });

});

//Attending Route
router.post('/bars/:place/:barId', isLoggedIn, function (req, res) {
    //console.log(req.params);  //{ place: 'San Francisco', barId: 'abv-san-francisco-2' }
    //console.log(req.params.place)
    YelpInfo.findOne({ YelpId: req.params.barId }, function (err, foundYelp) {
        //console.log(req.user)
        if (foundYelp === null) {
            YelpInfo.create({
                YelpId: req.params.barId,
                people: req.user._id
            }, function (err, savedYelp) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log('foundYelp is', foundYelp);
                    res.redirect('/bars/' + req.params.place);
                }
            })
        } else {
            //console.log('foundYelp from post before', foundYelp);
            //console.log(req.user);
            foundYelp.people.push(req.user._id);
            foundYelp.save();
            //console.log('foundYelp from post after', foundYelp);
            res.redirect('/bars/' + req.params.place);
        }

    });
});

router.delete('/bars/:place/:barId', isLoggedIn, function (req, res, next) {
    YelpInfo.findOne({ YelpId: req.params.barId }, function (err, foundYelp) {
        if (err) return next(err);
        if (!err) {
            //console.log(req.user._id);
            foundYelp.people.splice((foundYelp.people.indexOf(req.user._id)), 1);
            foundYelp.save();
            //console.log(foundYelp);
            res.redirect('/bars/' + req.params.place);
        }
    });
});


//This is amiddleware to prevent doing anything without any logins
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    //req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

module.exports = router;