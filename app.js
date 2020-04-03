const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
//const logger = require("morgan");

const routes = require("./routes/index");
const books = require("./routes/books");

const app = express();

// view engine set up
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);
app.use("/books", books);

// let's catch page not found (404)
app.use((req, res, next) => {
  next(createError(404));
});

//error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render error
  res.status(err.status || 500); // set response status code
  res.render("error");
});

module.exports = app;
