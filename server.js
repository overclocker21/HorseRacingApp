const express = require("express");
const exphbs = require("express-handlebars");
const path = require('path');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const dateFormat = require('dateformat');
const fetch = require("node-fetch");

const app = express();
const keys = require('./config/keys');

// Map global promise - get rid of warning
mongoose.Promise = global.Promise;

//connect to mongoose
mongoose.connect(keys.mongoURI, { useNewUrlParser: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

//Load OpenLeague model
const openLeague = require('./models/openLeague');

//Load PrivateLeague model
const privateLeague = require('./models/privateLeague');

//Load User model
const User = require('./models/user');

//Load Race model
const Race = require('./models/race').raceModel;

//Load Horse model
const Horse = require('./models/race').horseModel;

//Load MArketplace model
const MArketplace = require('./models/marketplace');

//Handlebars middleware
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set("view engine", "handlebars");

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Bring in Method Override middleware to handle PUT/DELETE requests from handlebars templates
app.use(methodOverride('_method'));

//use express-session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//use connect-flash
app.use(flash());

//setting global variables for our messages
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

//ROUTES:

//Login index route
app.get('/', (req, res) => {
    res.render('login', { layout: 'other' });
});

//fb login functionality
app.post('/login-bla', async (req, res) => {
    const { accessToken, userID } = req.body;
    console.log("TOKEN:" + accessToken);

    console.log("Storing user's id:");
    app.locals.uid = userID;

    //getting access token, storing userID and SessionId in the locals and redirecting to lobby

    await fetch('http://204.48.25.72:8080/functions/auth/facebook', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"facebookToken" : accessToken})
    }).then(response => {
        response.json().then(function (data) {

            console.log("Storing session id:");
            app.locals.sessionid = data.session;
            res.send({ redirect: '/lobby' });     
        });
    });
});

//Lobby Route with Open/Closed leagues and News
app.get('/lobby', async (req, res) => {

    let userId = req.app.locals.uid;
    console.log("User Id: " + userId);

    let sessionId = req.app.locals.sessionid;
    console.log("Session Id: " + sessionId);
    
    //fetching leagues:
    await fetch('http://204.48.25.72:8080/functions/leagues/fetch', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }).then(response => {
        response.json().then(function (data) {

            let private = data.leagues.filter(function (el) {
                return el.isPrivate === true;
              });

            let open = data.leagues.filter(function (el) {
            return el.isPrivate === false;
            });

            //reducing both open and private leagues count to 4

            let reducedPrivate = [];

            if (private.length <= 4){
                reducedPrivate = private;
            } else {
                    for (let i = 0; i < 4; i++){
                        reducedPrivate[i] = private[i];
                }
            }

            let reducedOpen = [];

            if (open.length <= 4){
                reducedOpen = open;
            } else {
                    for (let i = 0; i < 4; i++){
                        reducedOpen[i] = open[i];
                }
            }

            res.render("lobby", {
                private_leagues: reducedPrivate,
                open_leagues: reducedOpen
            });

        }).catch((error) => {
            console.log(error);
        });
    });

});

//Go to selected race
app.get('/selectedrace/:id', (req, res) => {

    //Storing Race Id in global variable
    app.locals.selectedRaceId = req.params.id;
    let userId = req.app.locals.uid;
    console.log("User Id: " + userId);


    Race.findById(req.params.id).exec(function (err, foundRace) {
        if (err) {
            console.log(err);
        } else {
            res.render("races/selectedrace", { foundRace: foundRace });
        }
    });

});

//Go to Marketplace
app.get('/marketplace', async (req, res) => {

    let sessionId = req.app.locals.sessionid;

    await fetch('http://204.48.25.72:8080/functions/horses/fetch', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }).then(response => {
        response.json().then(function (data) {
            console.log(data);
            
            res.render("marketplace", { foundPlace: data.horses });

        }).catch((error) => {
            console.log(error);
        });
    });

});

//Go to enrolled race and view stats
app.get('/enrolledracestats/:id', (req, res) => {

    //Storing Race Id in global variable
    app.locals.selectedRaceId = req.params.id;
    let userId = req.app.locals.uid;
    console.log("User Id: " + userId);


    Race.findById(req.params.id).exec(function (err, foundRace) {
        if (err) {
            console.log(err);
        } else {
            res.render("races/enrolledrace", { foundRace: foundRace });
        }
    });

});

//Go to Mission Statement
app.get('/mission', (req, res) => {

    res.render("mission");

});

//Go to My Account
app.get('/account', (req, res) => {

    let userId = req.app.locals.uid;

    User.findOne({ "uid": userId }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            console.log(foundUser.userRaces.length);

            res.render("myaccount", { foundUser: foundUser });
        }
    });
});

//Go to My Stables
app.get('/stables', async (req, res) => {

    let sessionId = req.app.locals.sessionid;

    await fetch('http://204.48.25.72:8080/functions/me/fetch', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }).then(response => {
        response.json().then(function (data) {
            
            res.render("mystables", { horses: data.user.horses });
            
        }).catch((error) => {
            console.log(error);
        });
    });

});

//Go to join race and add a horse
app.get('/addhorse', (req, res) => {

    let userId = req.app.locals.uid;

    User.findOne({ "uid": userId }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            res.render("horses/addhorse", { foundUser: foundUser });
        }
    });

});

//sell horse
app.post('/sellhorse/:id', async (req, res) => {

    let sessionId = req.app.locals.sessionid;
    let horseId = req.params.id;

    await fetch('http://204.48.25.72:8080/functions/horses/sell', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"horseId":horseId})
    }).then(response => {
        response.json().then(function (data) {
            req.flash('success_msg', 'Horse sold!');
            res.redirect('/stables');
        }).catch((error) => {
            console.log(error);
        });
    });
});

//buy horse
app.post('/buyhorse/:id', async (req, res) => {

    let sessionId = req.app.locals.sessionid;
    let horseId = req.params.id;

    await fetch('http://204.48.25.72:8080/functions/horses/purchase', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"horseId":horseId})
    }).then(response => {
        response.json().then(function (data) {
            console.log(data.reason);
            
            if (data.reason){
                req.flash('error_msg', 'The horse you are trying to buy is already in your stable!');
                res.redirect('/stables');
            } else {
                req.flash('success_msg', 'Horse bought!');
                res.redirect('/stables');
            }
        }).catch((error) => {
            console.log(error);
        });
    });

});

//add selected horse to the race
app.post('/addhorse/:name/add', (req, res) => {

    let userId = req.app.locals.uid;
    let nameOfHorse = req.params.name;
    let raceId = req.app.locals.selectedRaceId;

    Race.findById(raceId).exec(function (err, foundRace) {
        if (err) {
            console.log(err);
        } else {
            Horse.findOne({ "horseName": nameOfHorse }, (err, foundHorse) => {
                if (err) {
                    console.log(err);
                } else {
                    foundRace.horsesInRace.push(foundHorse);
                    foundRace.save();
                    console.log("Added horse to the race");

                    User.findOne({ "uid": userId }, (err, foundUser) => {
                        if (err) {
                            console.log(err);
                        } else {
                            foundUser.userRaces.push(foundRace);
                            foundUser.save();

                            console.log("Added race into user object");
                            console.log("Redirecting");

                        }
                    });
                }
            });
        }
        req.flash('success_msg', 'Joined to the race with your horse!');
        res.redirect("/myraces");
    });
});

//Go to My Races route
app.get('/myraces', (req, res) => {

    let userId = req.app.locals.uid;

    User.findOne({ "uid": userId }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            res.render("myraces", { foundUser: foundUser });
        }
    });

});

//get all races for any league
app.get('/races', async (req, res) => {

    let sessionId = req.app.locals.sessionid;

    await fetch('http://204.48.25.72:8080/functions/races/fetch', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }).then(response => {
        response.json().then(function (data) {

            res.render("races/all_races", { races: data.races });
            
        }).catch((error) => {
            console.log(error);
        });
    });

});


//Go to races of open league
app.get('/openraces/:id', (req, res) => {

    let userId = req.app.locals.uid;

    User.findOne({ "uid": userId }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            openLeague.findById(req.params.id).exec(function (err, foundLeague) {
                if (err) {
                    console.log(err);
                } else {

                    let available = new Array(foundLeague.races)[0];

                    let enrolled = new Array(foundUser.userRaces)[0];

                    let enrolledBelongToLeague = [];

                    for (var i = 0; i < available.length; i++) {
                        for (var j = 0; j < enrolled.length; j++) {
                            if (available[i].raceTitle === enrolled[j].raceTitle) {
                                enrolledBelongToLeague.push(available[i]);
                            }
                        }
                    }

                    let foundEnrolled = false;

                    for (var i = 0; i < enrolled.length; i++) {
                        for (var j = 0; j < available.length; j++) {
                            if (enrolled[i].raceTitle === available[j].raceTitle) {
                                foundEnrolled = true;
                            }
                        }
                    }

                    let returned = JSON.parse(JSON.stringify(foundLeague));

                    if (returned.races.length == 0) {
                        res.render("races/races", { available: available });
                    } else {

                        if (foundEnrolled) {
                            for (var i = 0; i < enrolledBelongToLeague.length; i++) {
                                for (var j = 0; j < available.length; j++) {
                                    if (enrolledBelongToLeague[i].raceTitle === available[j].raceTitle) {
                                        available = available.slice(0, j).concat(available.slice(j + 1, available.length));
                                    }
                                }
                            }
                            res.render("races/races", { available: available, enrolled: enrolledBelongToLeague });
                        } else {
                            res.render("races/races", { available: available });
                        }
                    }
                }
            });
        }
    });
});

//Go to races of private league
app.get('/privateraces/:id', (req, res) => {

    privateLeague.findById(req.params.id).exec(function (err, foundLeague) {
        if (err) {
            console.log(err);
        } else {
            res.render("races/races", { foundLeague: foundLeague });
        }
    });

});

//Add Open League Form
app.get('/openleagues/add', (req, res) => {
    res.render("openleagues/add");
});

//Get all open leagues
app.get('/allopenleagues', async (req, res) => {

    let sessionId = req.app.locals.sessionid;

    await fetch('http://204.48.25.72:8080/functions/leagues/fetch', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }).then(response => {
        response.json().then(function (data) {

            let open = data.leagues.filter(function (el) {
                return el.isPrivate === false;
              });

            res.render("openLeagues/all_open_leagues", {
                open_leagues: open
            });

        }).catch((error) => {
            console.log(error);
        });
    });

});

//Get all private leagues
app.get('/allprivateleagues', async (req, res) => {

    let sessionId = req.app.locals.sessionid;

    await fetch('http://204.48.25.72:8080/functions/leagues/fetch', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }).then(response => {
        response.json().then(function (data) {

            let private = data.leagues.filter(function (el) {
                return el.isPrivate === true;
              });

            res.render("privateLeagues/all_private_leagues", {
                private_leagues: private
            });

        }).catch((error) => {
            console.log(error);
        });
    });

});

//Add Private League Form
app.get('/privateleagues/add', (req, res) => {
    res.render("privateleagues/add");
});

//process open leagues form
app.post('/openleagues', async (req, res) => {

    let sessionId = req.app.locals.sessionid;
    
    const newOpenLeague = {
        "title": req.body.openTitle,
        "maxRaces": parseInt(req.body.numOfRaces),
        "maxPlayers": parseInt(req.body.numOfPlayers),
        "startDate": dateFormat(new Date(req.body.startDate), "yyyy-mm-d h:MM:ss+0000"),
        "endDate": dateFormat(new Date(req.body.endDate), "yyyy-mm-d h:MM:ss+0000"),
        "isPrivate": false
    };

    fetch('http://204.48.25.72:8080/functions/leagues/create', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newOpenLeague)
    }).then(response => {
        response.json().then(function (data) {

            if (data.reason === "invalidDateRange"){
                req.flash('error_msg', 'Please enter valid date range');
                res.redirect('/openleagues/add');
            } else {
                req.flash('success_msg', 'Open League Created!');
                res.redirect('/lobby');
            }
            
        }).catch((error) => {
            console.log(error);
        });
    });
});

//process private leagues form
app.post('/privateleagues', (req, res) => {

    let sessionId = req.app.locals.sessionid;
    
    const newPrivateLeague = {
        "title": req.body.privateTitle,
        "maxRaces": parseInt(req.body.numOfRaces),
        "maxPlayers": parseInt(req.body.numOfPlayers),
        "startDate": dateFormat(new Date(req.body.startDate), "yyyy-mm-d h:MM:ss+0000"),
        "endDate": dateFormat(new Date(req.body.endDate), "yyyy-mm-d h:MM:ss+0000"),
        "isPrivate": true
    };

    fetch('http://204.48.25.72:8080/functions/leagues/create', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newPrivateLeague)
    }).then(response => {
        response.json().then(function (data) {

            if (data.reason === "invalidDateRange"){
                req.flash('error_msg', 'Please enter valid date range');
                res.redirect('/privateleagues/add');
            } else {
                req.flash('success_msg', 'Private League Created!');
                res.redirect('/lobby');
            }
            
        }).catch((error) => {
            console.log(error);
        });
    });

});

//Starting server and listening to port 5000
const port = 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});