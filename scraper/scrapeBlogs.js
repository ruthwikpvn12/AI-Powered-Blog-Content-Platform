const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
require("dotenv").config();

const Article = require("../models/Article");

async function scrapeOldestBlogs() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("DB connected");

  // 1. Load first blogs page
  const { data } = await axios.get("https://beyondchats.com/blogs/");
  const $ = cheerio.load(data);

  // 2. Find last page number from pagination
  let lastPage = 1;
  $(".page-numbers").each((_, el) => {
    const num = parseInt($(el).text());
    if (!isNaN(num)) lastPage = Math.max(lastPage, num);
  });

  console.log("Last page detected:", lastPage);

  // 3. Load last page (oldest posts)
  const lastPageUrl = `https://beyondchats.com/blogs/page/${lastPage}/`;
  const lastPageHtml = await axios.get(lastPageUrl);
  const $$ = cheerio.load(lastPageHtml.data);

  // 4. Extract first 5 blog articles
  const articles = [];

  $$("article.post").slice(0, 5).each((_, el) => {
    const title = $$(el).find("h2 a").text().trim();
    const url = $$(el).find("h2 a").attr("href");

    articles.push({
      title,
      url,
      originalContent: "",
    });
  });

  // 5. Save to DB
  await Article.deleteMany({}); // clean old junk
  for (let art of articles) {
    await Article.create(art);
    console.log("Saved:", art.title);
  }

  console.log("✅ Phase 1 scraping done correctly");
  process.exit();
}

scrapeOldestBlogs();
