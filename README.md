# AI Article Enhancement Service

A Node.js backend service that scrapes blog articles, enhances them using AI, and stores structured results in MongoDB.

## Features
- Scrapes the oldest blog articles from BeyondChats
- Uses Google Search (Serper API) to find related references
- Enhances content using Gemini AI
- Stores original and enhanced content in MongoDB
- Modular backend structure with scripts and models

## Tech Stack
- Node.js
- Express
- MongoDB Atlas
- Cheerio & Axios (scraping)
- Serper API (search)
- Gemini API (content enhancement)

## Setup
```bash
npm install
