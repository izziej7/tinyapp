const express = require("express");
const methodOverride = require("method-override");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");

const app = express();
const PORT = 8080; // default port 8080

// MIDDLEWARE
app.use(methodOverride("_method"));

// set ejs as the template engine
app.set("view engine", "ejs");

// set up body parser
app.use(express.urlencoded({ extended: true }));

// set up cookie session
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"],
}));

// DATABASE
// set up urls object
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "c3yWo3",
    dateCreated: new Date(2023, 9, 5).toDateString(),
    totalVisits: 0,
    uniqueVisits: 0,
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "1tn6yL",
    dateCreated: new Date(2023, 9, 5).toDateString(),
    totalVisits: 0,
    uniqueVisits: 0,
  },
};

// set up users object
const users = {
  "c3yWo3": {
    id: "c3yWo3",
    email: "a@a.com",
    password: bcrypt.hashSync("123", 10),
  },
  "1tn6yL": {
    id: "1tn6yL",
    email: "b@b.com",
    password: bcrypt.hashSync("456", 10),
  },
};

// ROUTES FOR /
app.get("/", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/login");
  }

  return res.redirect("/urls");
});

// ROUTES FOR /URLS
// display all the URLs in the urls database
app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).send("Please log in.");
  }

  const templateVars = {
    user: users[userId],
    urls: urlsForUser(userId, urlDatabase),
  };

  return res.render("urls_index", templateVars);
});

// receive input from form in urls_new.ejs
// generate a short URL id and create a record in the urls database
// redirect to /urls/:id
app.post("/urls", (req, res) => {
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).send("Please log in.");
  }

  const urlId = generateRandomString();

  urlDatabase[urlId] = {
    longURL: req.body.longURL,
    userID: userId,
    dateCreated: new Date().toDateString(),
    totalVisits: 0,
    uniqueVisits: 0,
  };

  return res.redirect(`/urls/${urlId}`);
});

// ROUTES FOR /URLS/NEW
// display the form to create a new short URL
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/login");
  }

  const templateVars = {
    user: users[userId],
  };

  return res.render("urls_new", templateVars);
});

// ROUTES FOR /URLS/:ID
// display the specified short URL id and corresponding long URL
app.get("/urls/:id", (req, res) => {
  const urlId = req.params.id;
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).send("Please log in.");
  }

  if (!urlDatabase[urlId]) {
    return res.status(404).send("URL not found.");
  }
  
  if (userId !== urlDatabase[urlId].userID) {
    return res.status(403).send("You do not have authorization to view this.");
  }

  const templateVars = {
    user: users[userId],
    urlId,
    url: urlDatabase[urlId],
  };

  return res.render("urls_show", templateVars);
});

// receive input from form in urls_show.ejs
// edit the long URL in the specified record in the urls database
// redirect to /urls
app.put("/urls/:id", (req, res) => {
  const urlId = req.params.id;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).send("Please log in.");
  }

  if (!urlDatabase[urlId]) {
    return res.status(404).send("URL not found.");
  }

  if (userId !== urlDatabase[urlId].userID) {
    return res.status(403).send("You do not have authorization to edit this.");
  }
  
  urlDatabase[urlId].longURL = req.body.longURL;
  return res.redirect("/urls");
});

// ROUTES FOR /URLS/:ID/DELETE
// delete the specified record from the urls database
// redirect to /urls
app.delete("/urls/:id/delete", (req, res) => {
  const urlId = req.params.id;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).send("Please log in.");
  }

  if (!urlDatabase[urlId]) {
    return res.status(404).send("URL not found.");
  }

  if (userId !== urlDatabase[urlId].userID) {
    return res.status(403).send("You do not have authorization to delete this.");
  }
  
  delete urlDatabase[urlId];
  return res.redirect("/urls");
});

// ROUTES FOR /U/:ID
// update totalVisits and uniqueVisits
// redirect to the long URL
app.get("/u/:id", (req, res) => {
  const urlId = req.params.id;

  if (!urlDatabase[urlId]) {
    return res.status(404).send("URL not found.");
  }

  urlDatabase[urlId].totalVisits += 1;

  if (!req.session[`unique_visitor_${urlId}`]) {
    req.session[`unique_visitor_${urlId}`] = generateRandomString();
    urlDatabase[urlId].uniqueVisits += 1;
  }

  const longURL = urlDatabase[urlId].longURL;
  return res.redirect(longURL);
});

// ROUTES FOR /LOGIN
// display the form to login a user
app.get("/login", (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[userId],
  };

  return res.render("login", templateVars);
});

// receive input from form in login.ejs
// set cookie session for userId
// redirect to /urls
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Invalid login details.");
  }

  req.session.userId = user.id;
  return res.redirect("/urls");
});

// ROUTES FOR /LOGOUT
// clear cookie session
// redirect to /urls
app.post("/logout", (req, res) => {
  req.session.userId = null;
  return res.redirect("/login");
});

// ROUTES FOR /REGISTER
// display the form to register a new user
app.get("/register", (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[userId],
  };

  return res.render("register", templateVars);
});

// receive input from form in register.ejs
// generate a user id and create a record in the users database
// set cookie session for userId
// redirect to /urls
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (user || !email || !password) {
    return res.status(400).send("Invalid registration details.");
  }

  const id = generateRandomString();

  users[id] = {
    id,
    email,
    password: bcrypt.hashSync(password, 10),
  };

  req.session.userId = id;
  return res.redirect("/urls");
});

// listen on port 8080
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});