const { readFileSync, appendFileSync } = require("fs");
const puppeteer = require("puppeteer");
const getFBPosts = require("./crawler.js");

const INPUT_PATH = "../data/pages.txt"; // The list of facebook page URLs to crawl
const OUTPUT_PATH = "../data/posts.txt"; // The output file

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--disable-notifications"],
        timeout: 60000,
    });

    const pageURLs = readFileSync(INPUT_PATH, "utf8").trim().split("\n");

    const errorHandler = async (page, error) => {
        console.error(error.message);
        await page.screenshot({ path: `${OUTPUT_DIR}/error.png` });
    };

    const callback = async (post, index) => {
        appendFileSync(OUTPUT_PATH, "\n\n\n" + post.content);
        console.log("Done with post" + index);
    };

    for (const url of pageURLs) {
        console.log("Starting with " + url);
        await getFBPosts(browser, url, callback, errorHandler);
        console.log("Done with " + url);
    }

    await browser.close();
})();
