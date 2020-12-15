const express = require("express");
const uniqid = require("uniqid");

const { getComments, writeComments, getBooks } = require("../../fsUtilities");
const { check, validationResult } = require("express-validator");

const commentsRouter = express.Router();

commentsRouter.get("/", async (req, res, next) => {
  try {
    const comments = await getComments();
    res.send(comments);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

commentsRouter.get("/:commentID", async (req, res, next) => {
  try {
    const comments = await getComments();
    const comment = await comments.find(
      (comm) => comm._id === req.params.commentID
    );
    res.send(comment);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

commentsRouter.get("/book/:asin", async (req, res, next) => {
  try {
    const comments = await getComments();
    const commentsByBook = comments.filter(
      (comment) => comment.asin === req.params.asin
    );
    res.send(commentsByBook);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

commentsRouter.post(
  "/",
  [
    check("text")
      .exists()
      .isString()
      .withMessage("The comment must have a text"),
    check("username")
      .exists()
      .isString()
      .withMessage("The comment must have a username"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new Error();
        error.message = errors;
        error.httpStatusCode = 400;
        next(error);
      } else {
        const comments = await getComments();
        const books = await getBooks();
        console.log(comments);
        const asinFound = books.find((book) => book.asin === req.body.asin);
        console.log(asinFound);

        if (!asinFound) {
          const error = new Error();
          error.httpStatusCode = 404;
          error.message = "Book Not Found";
          next(error);
        } else {
          const comment = {
            ...req.body,
            createAt: Date.now(),
            updatedAt: Date.now(),
            _id: uniqid.time() + uniqid(),
          };
          comments.push(comment);
          await writeComments(comments);
          res.status(201).send({ comment: comment });
        }
      }
    } catch (error) {
      console.log(error);
      const err = new Error("An error occurred while reading from the file");
      next(err);
    }
  }
);

commentsRouter.put(
  "/:commentID",
  [
    check("text")
      .exists()
      .isString()
      .withMessage("The comment must have a text"),
    check("username")
      .exists()
      .isString()
      .withMessage("The comment must have a username"),
  ],
  async (req, res, next) => {
    try {
      const validatedData = matchedData(req);
      const comments = await getComments();
      const editedComment = {
        ...req.body,
        _id: req.params.commentID,
        updatedAt: Date.now(),
      };

      const commentIndex = comments.findIndex(
        (comment) => comment._id === req.params.commentID
      );

      if (commentIndex !== -1) {
        // book found
        comments[commentIndex] = editedComment;
        await writeBooks(comments);
        res.stauts(201).send(editedComment);
      } else {
        const err = new Error();
        err.httpStatusCode = 404;
        next(err);
      }
    } catch (error) {
      console.log(error);
      const err = new Error("An error occurred while reading from the file");
      next(err);
    }
  }
);

commentsRouter.delete("/:commentID", async (req, res, next) => {
  try {
    const comments = await getComments();

    const commentFound = comments.find(
      (comment) => comment._id === req.params.commentID
    );

    if (commentFound) {
      const filteredComments = comments.filter(
        (comment) => comment._id !== req.params.commentID
      );

      await writeComments(filteredComments);
      res.status(204).send();
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = commentsRouter;
