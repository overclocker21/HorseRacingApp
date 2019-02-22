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

let filterEnrolledRaces = require("./util/helpers");

//Handlebars middleware
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    helpers: {
        formatDateInUI: function (date) { 
            return dateFormat(date, "mmmm dS, yyyy");
        }
    }
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
app.get('/selectedrace/:id', async (req, res) => {

    let sessionId = req.app.locals.sessionid;

        //get selected race id is and store in locals
        app.locals.selected_race = req.params.id;

    await fetch('http://204.48.25.72:8080/functions/races/fetch', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }).then(response => {
        response.json().then(function (data) {

            let selected = data.races.filter(function (el) {
                return el.id === req.params.id;
              });

             console.log(selected);
              

            res.render("races/selectedrace", { race: selected[0] });
            
        }).catch((error) => {
            console.log(error);
        });
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

//Go to Mission Statement
app.get('/mission', (req, res) => {

    res.render("mission");

});

//Go to My Account
app.get('/account', async (req, res) => {

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
            
            res.render("myaccount", { foundUser: data.user });
            
        }).catch((error) => {
            console.log(error);
        });
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
app.get('/addhorse', async (req, res) => {

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
            
            res.render("horses/addhorse", { horses: data.user.horses });
            
        }).catch((error) => {
            console.log(error);
        });
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
                res.redirect('/marketplace');
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
app.post('/addbet/:id', async (req, res) => {

    let horseId = req.params.id;
    console.log("Horse ID:" + horseId);
    
    let leagueId = req.app.locals.selected_league;
    console.log("League ID: " + leagueId);

    let raceId = req.app.locals.selected_race;
    console.log("Race ID: " + raceId);

    let sessionId = req.app.locals.sessionid;

    await fetch('http://204.48.25.72:8080/functions/bets/add', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"horseId":horseId,
    "leagueId":leagueId,"raceId":raceId})
    }).then(response => {
        response.json().then(function (data) {
            console.log(data);
            
            if (data.reason === 'tooLate'){
                req.flash('error_msg', 'The race ended already!');
                res.redirect('/addhorse');
            } else {
                req.flash('success_msg', 'You just made a bet!');
                res.redirect('/lobby');
            }
        }).catch((error) => {
            console.log(error);
        });
    });
});

//Go to My Races route
app.get('/myraces', async (req, res) => {

    let sessionId = req.app.locals.sessionid;

    await fetch('http://204.48.25.72:8080/functions/me/fetch', {
        method: "POST",
        headers: {
            "Authorization": sessionId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    }).then(response => {
        response.json().then(async (me) => { return me })
        .then(async(me) => {
            await fetch('http://204.48.25.72:8080/functions/races/fetch', {
                method: "POST",
                headers: {
                    "Authorization": sessionId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            }).then(response => {
                response.json().then(function (all_races) {

                    let enrolled_races = filterEnrolledRaces(all_races.races, me.user.bets);
                    console.log(enrolled_races);
                                
                    res.render("myraces", { enrolled_races: enrolled_races });
                    
                }).catch((error) => {
                    console.log(error);
                });
            });
        })
        .catch((error) => {
            console.log(error);
        });
    });

});

//get all races for any league
app.get('/races/:id', async (req, res) => {

    let sessionId = req.app.locals.sessionid;
    
    //get selected league id is and store in locals
    app.locals.selected_league = req.params.id;

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