const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();

const Article = require("../models/Article");

async function scrapeBlogs() {
  try {
    // 1. Connect DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected");

    // 2. Go to blogs page
    let currentUrl = "https://beyondchats.com/blogs/";
    let lastPageUrl = currentUrl;

    // Traverse till oldest page
    while (true) {
      const { data } = await axios.get(currentUrl);
      const $ = cheerio.load(data);

      const olderLink = $("a.next.page-numbers").attr("href");

      if (!olderLink) break;
      lastPageUrl = olderLink;
      currentUrl = olderLink;
    }

    console.log("Oldest page:", lastPageUrl);

    // 3. Load oldest page
    const { data: lastPageHtml } = await axios.get(lastPageUrl);
    const $$ = cheerio.load(lastPageHtml);

    // 4. Clear old articles ONCE
    await Article.deleteMany({});

    // 5. Extract 5 oldest articles
    const articles = [];

    $$("article.post")
      .slice(0, 5)
      .each((_, el) => {
        const title = $$(el).find("h2 a").text().trim();
        const url = $$(el).find("h2 a").attr("href");

        if (title && url) {
          articles.push({
            title,
            url,
            originalContent: "",
            references: []
          });
        }
      });

    // 6. Save articles
    for (const art of articles) {
      await Article.create(art);
      console.log("Saved:", art.title);
    }

    console.log("Phase 1 scraping done correctly");
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error("Scraping failed:", err);
    process.exit(1);
  }
}

scrapeBlogs();
