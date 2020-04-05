const createError = require("http-errors");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

// default routes
const routes = require("./routes/index");

// books routes
const books = require("./routes/books");

const app = express();

// view engine set up
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);
app.use("/books", books);

// body parser
app.use(bodyParser.urlencoded({ extended: false }));

// let's catch page not found (404)
app.use((req, res, next) => {
  next(createError(404, "The resource you are looking for doesn't exist."));
});

//error handler
app.use((err, req, res, next) => {
  // render error
  res.status(err.status || 500); // set response status code
  if (err.status === 404) {
    res.render("error-page-not-found", {
      status: err.status,
      title: "Page Not Found",
    });
  } else {
    // show the error on the terminal
    console.log(err.stack);

    // show user friendly error on the UI
    res.render("error-server", { status: err.status, title: "Server Error" });
  }
});

module.exports = app;
