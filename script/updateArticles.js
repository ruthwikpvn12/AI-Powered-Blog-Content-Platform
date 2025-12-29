const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");

require("dotenv").config();

const Article = require("../models/Article");

async function googleSearch(query) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query }),
  });

  const data = await res.json();
  return data.organic.slice(0, 2).map(r => r.link);
}

async function scrapeContent(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  let text = "";
  $("p").each((_, el) => {
    text += $(el).text() + "\n";
  });

  return text.slice(0, 4000);
}

async function rewriteWithGemini(title, references) {
  const prompt = `
Rewrite an article titled "${title}".
Use the reference content below.
Make it original, informative, and professional.

REFERENCE:
${references.join("\n\n")}
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("DB connected (Phase 2)");

  const articles = await Article.find();
  console.log("Articles found:", articles.length);

  for (const article of articles) {
    console.log("Processing:", article.title);

    const links = await googleSearch(article.title);
    const contents = [];

    for (const link of links) {
      const text = await scrapeContent(link);
      contents.push(text);
    }

    const rewritten = await rewriteWithGemini(article.title, contents);

    article.updatedContent = rewritten;
    article.references = links;
    await article.save();

    console.log("Updated:", article.title);
  }

  console.log("Phase 2 completed");
  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
