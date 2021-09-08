// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv/config");

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require("hbs");

const app = express();


// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);


//session config
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: false, // <== false if you don't want to save empty session object to the store
      cookie: {
        sameSite: 'none',
        httpOnly: true,
        maxAge: 60000 // 60 * 1000 ms === 1 min
      },
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost/db-name'
      })
    })
  );

  // end of session config


  const User = require('./models/User.model');
 
  const bcrypt = require('bcrypt');
  const passport = require('passport');
  const LocalStrategy = require('passport-local').Strategy;
   
  passport.serializeUser((user, cb) => cb(null, user._id));
   
  passport.deserializeUser((id, cb) => {
    User.findById(id)
      .then(user => cb(null, user))
      .catch(err => cb(err));
  });
   
  passport.use(
    new LocalStrategy(
      { passReqToCallback: true },
      {
        usernameField: 'username', 
        passwordField: 'password' 
      },
      (username, password, done) => {
        User.findOne({ username })
          .then(user => {
            if (!user) {
              return done(null, false, { message: 'Incorrect username' });
            }
   
            if (!bcrypt.compareSync(password, user.password)) {
              return done(null, false, { message: 'Incorrect password' });
            }
   
            done(null, user);
          })
          .catch(err => done(err));
      }
    )
  );

app.use(passport.initialize());
app.use(passport.session());



// default value for title local
const projectName = "basic-auth";
const capitalized = (string) => string[0].toUpperCase() + string.slice(1).toLowerCase();

app.locals.title = `${capitalized(projectName)} created with IronLauncher`;

// 👇 Start handling routes here
const index = require("./routes/index");
app.use("/", index);

const authRouter = require('./routes/auth');
app.use('/', authRouter);



// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
