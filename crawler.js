const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const config = require("./config.js");
const getParameterValue = require("./ssm.js");

// Helper function here
const getActiveElement = async (page) => {
    const element = await page.evaluateHandle(() => document.activeElement);
    return element;
};

const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
};

const getEmbedContent = async (page, postElement) => {
    await postElement.$eval(config.ACTION_BTN_SELECTOR, (actionBtn) => {
        if (actionBtn != undefined) actionBtn.click();
    });

    await sleep(4500 + Math.floor(Math.random() * 500));
    await page.$$eval("span", (elements) => {
        const embedElement = elements.find(
            (element) => element.textContent.trim() === "Embed"
        );
        if (embedElement != undefined) embedElement.click();
    });

    await page.waitForSelector(config.SAMPLE_CODE_INPUT_SELECTOR, {
        delay: 40000,
    });
    const embeds = await page.$$eval(
        config.SAMPLE_CODE_INPUT_SELECTOR,
        (embeds) => embeds.map((embed) => embed.value)
    );

    await page.keyboard.press("Escape");

    return embeds[embeds.length - 1];
};

const getPostURL = async (embed) => {
    const src = embed.split("href=")[1].split(" ")[0].split("&")[0];
    let url = src.replace(/%2F/gi, "/");
    url = url.replace(/%3A/gi, ":");
    return url;
};

const getPostId = async (postURL) => {
    const postTypes = ["posts", "photos", "videos"];
    for (const type of postTypes) {
        if (postURL.includes(type)) {
            return postURL.split(type + "/")[1].split("/")[0];
        }
    }
    return null;
};

const getPostContent = async (postElement) => {
    const content = await postElement.$eval(
        config.CONTENT_SELECTOR,
        (e) => e.textContent
    );
    return content;
};

async function login(page) {
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
}

async function getFBPosts(
    browser,
    pageURL,
    callback = async () => {},
    errorHandler = async () => {}
) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });

    try {
        await page.goto(pageURL);

        // Login
        if ((await page.$(config.USERNAME_SELECTOR)) != null) {
            await login(page);
            console.log("[INFO]: Logged in");
        }

        let posts = [];
        let numOfPostsOnPage = 0;
        while (true) {
            await scrollPageToBottom(page, { size: 200, delay: 100 });
            posts = await page.$$(config.POST_SELECTOR);
            if (posts.length <= numOfPostsOnPage || posts.length > 20) break;
            numOfPostsOnPage = posts.length;
        }

        await page.evaluate(() => {
            const btns = document.querySelectorAll('div[role="button"]');
            Array.from(btns)
                .filter((btn) => btn.textContent === "See more")
                .forEach((btn) => btn.click());
        });

        const data = [];
        posts = posts.slice(0, 20);
        for (const [index, post] of posts.entries()) {
            const url = await getPostURL(await getEmbedContent(page, post));
            const id = await getPostId(url);
            const content = await getPostContent(post);
            const postInfo = { url, id, content };
            await callback(postInfo, index);
            data.push(postInfo);
        }

        return data;
    } catch (error) {
        await errorHandler(page, error);
    }
}

module.exports = getFBPosts;
