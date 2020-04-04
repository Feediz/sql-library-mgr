const express = require("express");
const router = express.Router();
const Book = require("../models").Book;

// async handler function to wrap each route
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      res.status(500).send(err);
    }
  };
}

function handleRenderGet(view, req, res, books) {
  res.render(view, { books });
}

function handleRenderGetSingle(view, req, res, book, title) {
  if (book) {
    res.render(view, { book, title });
  } else {
    res.sendStatus(404);
  }
}

// get handlers

// GET -> All books
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const books = await Book.findAll();
    handleRenderGet("books/index", req, res, books);
  })
);

// GET -> book by id
router.get(
  "/:id/edit",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    handleRenderGetSingle(
      "books/show",
      req,
      res,
      book,
      "Update Book - " + book.title
    );
  })
);
// GET -> new book form
router.get("/new", (req, res) => {
  handleRenderGetSingle("books/new", req, res, {}, "Add New Book");
  //res.render("books/new", { book: {}, title: "New Book" });
  // res.send("ldskjfalsdfjadslfjalsdfj");
});

// post handlers

// POST -> post new book to db
router.post(
  "/",
  asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.create(req.body);
      if (book) {
        res.redirect("/books/" + book.id);
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      if (err.name === "SequelizeValidationError") {
        // check for validation errors
        book = await Book.build(req.body);
        res.render("books/new", {
          book,
          errors: err.errors
        });
      } else {
        throw error; // error caught in the asyncHandler's catch block
      }
    }
  })
);

// POST -> update book in db
router.post(
  "/:id/edit",
  asyncHandler(async (req, res) => {
    let book;

    try {
      book = await Book.findByPk(req.params.id);
      if (book) {
        await book.update(req.body);
        res.redirect("/books/" + req.params.id + "/edit");
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      if (err.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        book.id = req.params.id;
        res.render("books/show", {
          book,
          errors: err.errors
        });
      } else {
        throw error;
      }
    }
  })
);

// POST -> delete a book in db
router.post(
  "/books/:id/delete",
  asyncHandler(async (req, res) => {
    try {
      let book = await Book.findByPk(req.params.id);
      if (book) {
        book.destroy();
        res.redirect("/books");
      } else {
        res.sendStatus(404);
      }
    } catch (err) {}
  })
);

module.exports = router;
