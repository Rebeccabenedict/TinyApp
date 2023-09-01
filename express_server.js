const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const PORT = 8080; 
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const {getUserFromEmail, urlsForUser} = require('./helpers')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 24 * 60 * 60 * 1000 
  }))

app.set("view engine", "ejs")


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
    userRandomID: {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur",
    },
    user2RandomID: {
      id: "user2RandomID",
      email: "user2@example.com",
      password: "dishwasher-funk",
    },
  };

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello!");
  });

app.get("/urls", (req, res) => {
    console.log(req.session, "req.session");
    if(req.session === undefined){
        res.redirect('/login');
    }
    else {
        const userID = req.session.user_ID;
    
        const urls = urlsForUser(userID, urlDatabase);
        console.log(users[userID], "user_ID from get URL")
        const templateVars = { urls: urls, user_ID: users[userID] };
        res.render("urls_index", templateVars);
    }
   
});

app.get("/login", (req, res) => {
    const userID = req.session.user_id;
    if (userID) {
      res.redirect('/urls');
      return;
    }
    const templateVars = { user_ID: users[userID] };
    res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
    const userID = req.session.user_ID;
    if (userID) {
      const templateVars = { user_ID: users[userID] };
      res.render("urls_new", templateVars);
    } else {
      res.redirect('/login');
    }
  });

  app.get("/register", (req, res) => {
    const userID = req.session.user_ID;
    if (userID) {
      res.redirect('/urls');
      return;
    }
    else{
        const templateVars = { user_ID: users[userID] };
        res.render("register", templateVars);
    }
});

app.get("/urls/:id", (req, res) => {
    const templateVars = { id: req.params.id, longURL: urlDatabase };
    res.render("urls_show", templateVars);
});
  
  app.post('/register', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
      res.status(400);
      res.send("Please enter a valid email & password");
      return;
    }
  
    if (getUserFromEmail(users, email) !== false) {
      res.status(400);
      res.send("Email already exists, please log in");
      return;
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log("hash ", hashedPassword);
  

    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: email,
      password: hashedPassword
    };
  
    req.session['user_id'] = userID;
    res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
      const short = req.params.shortURL;
      const newURL = req.body.newURL;
      const userID = req.session.user_id;
    
      if (urlDatabase[short].userID === userID) {
        urlDatabase[short].longURL = newURL;
        res.redirect('/urls');
        return;
      } else {
        res.status(401);
        res.send("You are not authorized to edit this URL");
      }
    });

app.post("/urls/:shortURL/delete", (req,res) => {
      const shortURL = req.params.shortURL;
      if (req.session.user_ID === urlDatabase[shortURL].userID) {
        delete urlDatabase[req.params.shortURL];
        res.redirect("/urls");
      } else {
        let templateVars = {
          status: 401,
          message: 'You cannot delete this URL.',
          user: users[req.session.user_id]
        }
        res.status(401);
        res.render("urls_error", templateVars);
      }
});
app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const userFromEmail = getUserFromEmail(users, email);
    const hashedPassword = userFromEmail.password;
  
    if (!email || !password) {
      res.status(400);
      res.send("Please enter a valid email & password");
      return;
    }
  
    if (userFromEmail === false) {
      res.status(403);
      res.send("Email not found, please register");
      return;
    } else {
      if (!bcrypt.compareSync(password, hashedPassword)) {
        res.status(401);
        res.send("Incorrect password, please try again");
        return;
      } else {
        req.session.user_id = userFromEmail.id;
        res.redirect('/urls');
      }
    }
});

app.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('/urls');
});
  
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});