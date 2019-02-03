const express = require("express");
const exphbs = require("express-handlebars");
const path = require('path');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
let seedDBwithRaces = require("./seed");
let seedDBwithHorses = require("./seedHorses");
let seedDBwithHorsesForUser = require("./seedHorsesForUsers");
let seedDBwithHorsesForMplace = require("./seedHorsesForMplace");
const fetch = require("node-fetch");

const app = express();
const keys = require('./config/keys');

// Map global promise - get rid of warning
mongoose.Promise = global.Promise;

//connect to mongoose
mongoose.connect(keys.mongoURI, { useNewUrlParser: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

//Seed db with races or horses
//seedDBwithRaces();
//seedDBwithHorses();
//seedDBwithHorsesForUser(); //won't need this whe nmarketplace is available
//seedDBwithHorsesForMplace();

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

    const returned = await fetch(`https://graph.facebook.com/v3.2/me?access_token=${accessToken}&method=get&pretty=0&sdk=joey&suppress_http_code=1`);

    const json = await returned.json();

    // TODO: uncomment when prod ready!
    //app.locals.uid = userID;

    if (json.id === userID) {
        const found = await User.findOne({ uid: userID });

        if (found) {
            //user is registered, create a session

            res.send({ redirect: '/lobby' });
            res.end();
        } else {
            const user = new User({
                name: json.name,
                uid: userID
            });
            await user.save();
            res.json({ status: 'ok', data: 'You are registered and logged in' });
            res.send({ redirect: '/lobby' });
            res.end();
        }


    } else {
        //log a worning(record user ip maybe or ?)
        res.json({ status: 'error', data: 'Something went wrong' });
        res.end();
    }

});

//Lobby Route with Open/Closed leagues and News
app.get('/lobby', (req, res) => {

    // TODO: remove when Prod ready
    app.locals.uid = 773160929731148;

    openLeague.find({})
        .limit(4)
        .then(open_leagues => {
            privateLeague.find({})
                .limit(4)
                .then(private_leagues => {
                    res.render("lobby", {
                        open_leagues: open_leagues,
                        private_leagues: private_leagues
                    });
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
app.get('/marketplace', (req, res) => {

    MArketplace.findOne({ "type": "horses" }, (err, foundPlace) => {
        if (err) {
            console.log(err);
        } else {
            res.render("marketplace", { foundPlace: foundPlace });
        }
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
app.get('/stables', (req, res) => {

    let userId = req.app.locals.uid;

    User.findOne({ "uid": userId }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            res.render("mystables", { foundUser: foundUser });
        }
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
app.delete('/sellhorse/:id', (req, res) => {

    let userId = req.app.locals.uid;

    User.findOne({ "uid": userId }, (err, foundUser) => {
        if (err) {
            req.flash('error_msg', 'Cannot sell a horse at the moment!');
            console.log(err);
        } else {
            foundUser.userHorses.id(req.params.id).remove();
            foundUser.save();
            console.log("Deleted!");
            req.flash('success_msg', 'Horse sold!');
            res.redirect('/stables');
        }
    });

});

//buy horse
app.delete('/buyhorse/:id', (req, res) => {

    let userId = req.app.locals.uid;

    User.findOne({ "uid": userId }, (err, foundUser) => {
        if (err) {
            req.flash('error_msg', 'Cannot buy a horse at the moment!');
            console.log(err);
        } else {

            MArketplace.findOne({ "type": "horses" }, (err, foundMplace) => {
                if (err) {
                    req.flash('error_msg', 'Cannot find Marketplace!');
                    console.log(err);
                } else {

                    let boughtHorse = foundMplace.horses.id(req.params.id);

                    foundUser.userHorses.push(boughtHorse);
                    foundUser.save();
                    req.flash('success_msg', 'Horse bought!');
                    res.redirect('/stables');
                }
            });
        }

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
app.get('/allopenleagues', (req, res) => {

    openLeague.find({})
        .then(open_leagues => {
            res.render("openleagues/all_open_leagues", {
                open_leagues: open_leagues
            });
        });

});

//Get all private leagues
app.get('/allprivateleagues', (req, res) => {

    privateLeague.find({})
        .then(private_leagues => {
            res.render("privateLeagues/all_private_leagues", {
                private_leagues: private_leagues
            });
        });

});

//Add Private League Form
app.get('/privateleagues/add', (req, res) => {
    res.render("privateleagues/add");
});

//process open leagues form
app.post('/openleagues', (req, res) => {

    const newOpenLeague = {
        openTitle: req.body.openTitle,
        numOfRaces: req.body.numOfRaces,
        numOfPlayers: req.body.numOfPlayers,
        numOfHorses: req.body.numOfHorses,
        typeOfHorses: req.body.typeOfHorses,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
    };

    new openLeague(newOpenLeague)
        .save()
        .then(league => {
            req.flash('success_msg', 'Open League Created!');
            res.redirect('/lobby');
        });
});

//process private leagues form
app.post('/privateleagues', (req, res) => {
    console.log(req.body);
    const newPrivateLeague = {
        privateTitle: req.body.privateTitle,
        numOfRaces: req.body.numOfRaces,
        numOfPlayers: req.body.numOfPlayers,
        numOfHorses: req.body.numOfHorses,
        typeOfHorses: req.body.typeOfHorses,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
    };

    new privateLeague(newPrivateLeague)
        .save()
        .then(league => {
            req.flash('success_msg', 'Private League Created!');
            res.redirect('/lobby');
        });
});

//Starting server and listening to port 5000
const port = 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});