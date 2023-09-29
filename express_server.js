const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// set ejs as the template engine
app.set("view engine", "ejs");

// set up body parser
app.use(express.urlencoded({ extended: true }));

// generate a random short URL id
function generateRandomString() {
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
}

// set up database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// ROUTES FOR /URLS
// display all the URLs in the database
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// receive input from form in urls_new.ejs
// generate a short URL id and create a record in the database
// redirect to /urls/:id
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// ROUTES FOR /URLS/NEW
// display the form to create a new short URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// ROUTES FOR /URLS/:ID
// display the specified short URL id and corresponding long URL
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// receive input from form in urls_show.ejs
// edit the long URL in the specified record in the database
// redirect to /urls
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// ROUTES FOR /URLS/:ID/DELETE
// delete the specified record from the database
// redirect to /urls
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// ROUTES FOR /U/:ID
// redirect to the long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// listen on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});