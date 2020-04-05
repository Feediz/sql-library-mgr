const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.redirect("/books");
});
router.get("/err", (req, res, next) => {
  res.send(error());
});
module.exports = router;
