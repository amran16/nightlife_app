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
