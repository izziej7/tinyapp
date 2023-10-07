// generate a random short URL id or user id
const generateRandomString = () => {
  let randomString = '';

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return randomString;
};

// return the user if found or null if not based on the specified email
const getUserByEmail = (email, users) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

// return the URLs associated with the specified userID as an object
const urlsForUser = (userId, urlDatabase) => {
  const urlDatabaseById = {};

  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId].userID === userId) {
      urlDatabaseById[urlId] = urlDatabase[urlId];
    }
  }

  return urlDatabaseById;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };