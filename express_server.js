const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

// set ejs as the template engine
app.set("view engine", "ejs");

// set up body parser
app.use(express.urlencoded({ extended: true }));

// set up cookie parser
app.use(cookieParser());

// DATABASE
// set up url object
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "c3yWo3",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "1tn6yL",
  },
};

// set up user object
const users = {
  "c3yWo3": {
    id: "c3yWo3",
    email: "a@a.com",
    password: "123",
  },
  "1tn6yL": {
    id: "1tn6yL",
    email: "b@b.com",
    password: "456",
  },
};

// FUNCTIONS
// generate a random short URL id or user id
function generateRandomString() {
  let randomString = '';

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return randomString;
}

// return the user based on the specified id
function getUserById(userId) {
  for (const uid in users) {
    if (users[uid].id === userId) {
      return users[uid];
    }
  }
}

// return the user if found or null if not based on the specified email
function getUserByEmail(email) {
  for (const uid in users) {
    if (users[uid].email === email) {
      return users[uid];
    }
  }
  return null;
}

// ROUTES FOR /URLS
// display all the URLs in the urls database
// display the email if logged in
app.get("/urls", (req, res) => {
  const user = getUserById(req.cookies["user_id"]);
  const templateVars = {
    user,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

// receive input from form in urls_new.ejs
// generate a short URL id and create a record in the urls database
// redirect to /urls/:id
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(401).send("You must be logged in to shorten URLs.");
  }

  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  res.redirect(`/urls/${id}`);
});

// ROUTES FOR /URLS/NEW
// display the form to create a new short URL
// display the email if logged in
app.get("/urls/new", (req, res) => {
  const user = getUserById(req.cookies["user_id"]);

  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

// ROUTES FOR /URLS/:ID
// handle errors if id does not exist
// display the specified short URL id and corresponding long URL
// display the email if logged in
app.get("/urls/:id", (req, res) => {
  const idExists = urlDatabase.hasOwnProperty(req.params.id);

  if (!idExists) {
    return res.status(404).send("ID not found.");
  }

  const user = getUserById(req.cookies["user_id"]);
  const templateVars = {
    user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
  };
  res.render("urls_show", templateVars);
});

// receive input from form in urls_show.ejs
// edit the long URL in the specified record in the urls database
// redirect to /urls
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// ROUTES FOR /URLS/:ID/DELETE
// delete the specified record from the urls database
// redirect to /urls
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// ROUTES FOR /U/:ID
// redirect to the long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// ROUTES FOR /LOGIN
// display the form to login a user
// display the email if logged in
app.get("/login", (req, res) => {
  const user = getUserById(req.cookies["user_id"]);

  if (user) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user,
  };
  res.render("login", templateVars);
});

// receive input from form in login.ejs
// handle errors if email and/or password are invalid
// set cookie for user_id
// redirect to /urls
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!getUserByEmail(email)) {
    return res.status(403).send("Invalid email.");
  }

  const validUser = getUserByEmail(email);

  if (validUser.password !== password) {
    return res.status(403).send("Invalid password.");
  }

  res.cookie("user_id", validUser.id);
  res.redirect("/urls");
});

// ROUTES FOR /LOGOUT
// clear cookie for user_id
// redirect to /urls
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// ROUTES FOR /REGISTER
// display the form to register a new user
// display the email if logged in
app.get("/register", (req, res) => {
  const user = getUserById(req.cookies["user_id"]);

  if (user) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user,
  };
  res.render("register", templateVars);
});

// receive input from form in register.ejs
// handle errors if email and/or password are invalid
// generate a user id and create a record in the users database
// set cookie for user_id
// redirect to /urls
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Email and/or password not provided.");
  }

  if (getUserByEmail(email)) {
    return res.status(400).send("Email already registered.");
  }

  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password,
  };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

// listen on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});