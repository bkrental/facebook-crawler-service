import puppeteer from "puppeteer";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";
import config from "./config.js";
import { getParameterValue } from "./ssm.js";
import fs from "fs";

// Helper function here
const getActiveElement = async (page) => {
    const element = await page.evaluateHandle(() => document.activeElement);
    return element;
};

const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
};

async function getPostsFromPage(pageURL, numOfPosts = 10) {
    const browser = await puppeteer.launch({
        headless: false,
        timeout: 60000,
    });

    const context = browser.defaultBrowserContext();
    context.overridePermissions(pageURL, ["notifications"]);

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto(pageURL);

    // Login
    await page.click(config.USERNAME_SELECTOR);
    const emailInput = await getActiveElement(page);
    const username = await getParameterValue("FB_USERNAME", config.USERNAME);
    await emailInput.type(username);

    await page.keyboard.press("Tab");
    const passwordInput = await getActiveElement(page);
    const password = await getParameterValue("FB_PASSWORD", config.PASSWORD);
    await passwordInput.type(password);

    await page.keyboard.press("Enter");
    await page.waitForNavigation();

    let posts = [];
    while (posts.length < numOfPosts) {
        posts = await page.$$eval(config.POST_SELECTOR, (posts) =>
            Array.from(posts).map((post) => post.textContent)
        );
        await scrollPageToBottom(page, { size: 500, delay: 250 });
        await page.evaluate(() => {
            const btns = document.querySelectorAll('div[role="button"]');
            Array.from(btns)
                .filter((btn) => btn.textContent === "See more")
                .forEach((btn) => btn.click());
        });
    }

    fs.writeFileSync("data.txt", posts.join("\n\n"));

    await browser.close();
}

if (process.argv.length > 2) {
    const pageURL = process.argv[2];
    const numOfPosts = process.argv[3] * 1;
    console.log(pageURL, numOfPosts);
    getPostsFromPage(pageURL, numOfPosts);
} else {
    console.log("ERROR: Please specify the page URL");
}
