const express = require("express");
const router = express.Router();
const controller = require("../controllers/articleController");

router.post("/", controller.createArticle);
router.get("/", controller.getArticles);
router.get("/:id", controller.getArticleById);
router.put("/:id", controller.updateArticle);
router.delete("/:id", controller.deleteArticle);

module.exports = router;
