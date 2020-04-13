const express = require("express");
const router = express.Router();
const Book = require("../models").Book;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// async handler function to wrap each route
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  };
}

// function to handle rendering from home page
function handleRenderHome(view, req, res, books, data) {
  res.render(view, { books, title: "Home", data });
}

// function to handle rendering from any page except home page
function handleRenderGet(view, req, res, book, title, next = null) {
  try {
    if (book) {
      let tmpTitle = "";
      if (book.title !== undefined) {
        tmpTitle = " - " + book.title;
      }
      res.render(view, { book, title: title + tmpTitle });
    } else {
      res.render("error-page-not-found", {});
    }
  } catch (error) {
    res.status(500).send(error);
  }
}

/** router => returns all books
 * @route /books
 * @method get
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    // will be used to hold information related to pagination and search feature
    let data = {};

    // try to get current page from query string and if it's not there we set it to one
    if (req.query.p > 0) {
      data.currPage = req.query.p;
    } else {
      data.currPage = 1;
    }

    // try to get total pages from query string and if it exists
    if (req.query.c > 0) {
      data.pageCount = req.query.c;
    }

    let offSet = (data.currPage - 1) * 3;

    // try to get search term from query string and if it doesn't exist we set it to empty string
    if (req.query.q === undefined) {
      data.searchTerm = "";
    } else {
      data.searchTerm = req.query.q;
    }

    data.limit = 3;

    // will hold book records
    let books = "";

    if (data.currPage > 0) {
      if (data.searchTerm !== "") {
        let tempBooks = await Book.findAndCountAll({
          where: {
            [Op.or]: {
              title: {
                [Op.like]: `%${data.searchTerm}%`,
              },
              author: {
                [Op.like]: `%${data.searchTerm}%`,
              },
              genre: {
                [Op.like]: `%${data.searchTerm}%`,
              },
              year: {
                [Op.like]: `%${data.searchTerm}%`,
              },
            },
          },
          offset: offSet,
          limit: data.limit,
        });
        books = tempBooks.rows;
      } else {
        // show all
        const tempBooks = await Book.findAndCountAll({
          offset: offSet,
          limit: data.limit,
        });
        books = tempBooks.rows;
        data.itemsPerPage = 3;
        data.totalRecords = tempBooks.count;
        data.pageCount = Math.ceil(data.totalRecords / data.itemsPerPage); // to get total pages needed we will divide total records by items per page and round up
      }
    } else {
      res.sendStatus(404);
    }
    if (books) {
      handleRenderHome("books/index", req, res, books, data);
    } else {
      res.sendStatus(404);
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    // will be used to hold information related to pagination and search feature
    let data = {};

    data.searchTerm = req.body.q.toLowerCase();
    data.limit = 3;
    data.startIndex = 0;

    const books = await Book.findAndCountAll({
      where: {
        [Op.or]: {
          title: {
            [Op.like]: `%${data.searchTerm}%`,
          },
          author: {
            [Op.like]: `%${data.searchTerm}%`,
          },
          genre: {
            [Op.like]: `%${data.searchTerm}%`,
          },
          year: {
            [Op.like]: `%${data.searchTerm}%`,
          },
        },
      },
      offset: data.startIndex,
      limit: data.limit,
    });

    data.currPage = 1;
    data.itemsPerPage = 3;
    data.totalRecords = books.count;
    data.pageCount = Math.ceil(data.totalRecords / data.itemsPerPage); // to get total pages needed we will divide total records by items per page and round up

    if (books.rows.length > 0) {
      handleRenderHome("books/index", req, res, books.rows, data);
    } else {
      res.sendStatus(404);
    }
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
          errors: err.errors,
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
  asyncHandler(async (req, res, next) => {
    const book = await Book.findByPk(req.params.id);
    handleRenderGet("books/update-book", req, res, book, "Update Book", next);
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
          errors: err.errors,
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
