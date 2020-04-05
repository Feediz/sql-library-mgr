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

function handleRenderHome(view, req, res, books) {
  res.render(view, { books, title: "Home" });
}

function handleRenderGet(view, req, res, book, title) {
  if (book) {
    res.render(view, { book, title });
  } else {
    res.sendStatus(404);
  }
}

/** router => returns all books
 * @route /books
 * @method get
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const books = await Book.findAll();
    handleRenderHome("books/index", req, res, books);
  })
);

/** router => returns form to add book
 * @route /books/new
 * @method get
 */
router.get("/new", (req, res) => {
  handleRenderGet("books/new-book", req, res, {}, "Add New Book");
});

/** router => adds new book to db
 * @route /books/new
 * @method post
 */
router.post(
  "/new",
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
        res.render("books/new-book", {
          book,
          errors: err.errors
        });
      } else {
        throw error; // error caught in the asyncHandler's catch block
      }
    }
  })
);

/** router => returns book details with the given id
 * @route /books/:id
 * @method get
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    handleRenderGet(
      "books/update-book",
      req,
      res,
      book,
      "Update Book - " + book.title
    );
  })
);

/** router => updates book details with the given id
 * @route /books/:id
 * @method post
 */
router.post(
  "/:id",
  asyncHandler(async (req, res) => {
    let book;

    try {
      book = await Book.findByPk(req.params.id);
      if (book) {
        await book.update(req.body);
        res.redirect("/books/" + req.params.id);
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      if (err.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        book.id = req.params.id;
        res.render("books/update-book", {
          book,
          errors: err.errors
        });
      } else {
        throw error;
      }
    }
  })
);

/** router => deletes book with the given id
 * @route /books/:id/delete
 * @method post
 */
router.post(
  "/:id/delete",
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
