const { readFileSync, appendFileSync } = require("fs");
const puppeteer = require("puppeteer");
const getFBPosts = require("./crawler.js");

const INPUT_PATH = "./data/pages.txt"; // The list of facebook page URLs to crawl
const OUTPUT_PATH = "./data/posts.txt"; // The output file
const ERROR_PATH = "./logs/error.png"; // The error file
const IS_PAGE = false; // Set to false if you want to crawl a facebook group
const DEBUG_MODE = process.argv[2] && process.argv[2] == "debug";

(async () => {
    const browser = await puppeteer.launch({
        headless: DEBUG_MODE ? false : "new",
        args: ["--disable-notifications"],
        timeout: 60000,
    });

    const pageURLs = readFileSync(INPUT_PATH, "utf8").trim().split("\n");

    const errorHandler = async (page, error) => {
        console.error(error.message);
        await page.screenshot({ path: ERROR_PATH });
    };

    const callback = async (post, index) => {
        appendFileSync(OUTPUT_PATH, "\n\n\n" + post.content);
        console.log("Done with post" + index);
    };

    for (const url of pageURLs) {
        console.log("Starting with " + url);
        await getFBPosts(browser, url, callback, errorHandler, IS_PAGE);
        console.log("Done with " + url);
    }

    await browser.close();
})();
