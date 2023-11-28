const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const config = require("./config.js");
const getParameterValue = require("./ssm.js");

// Helper function here
const checkIsGroupURL = (url) => {
    return url.startsWith("https://www.facebook.com/groups/");
};

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

const getPostContent = async (postElement, isFBGroup = false) => {
    if (isFBGroup)
        return await (await postElement.getProperty("textContent")).jsonValue();

    return await postElement.$eval(
        config.CONTENT_SELECTOR,
        (e) => e.textContent
    );
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

async function getFBPosts(browser, url, callback, errorHandler) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });

    try {
        await page.goto(url);
        const isFBGroup = checkIsGroupURL(url);

        // Login
        if ((await page.$(config.USERNAME_SELECTOR)) != null) {
            await login(page);
            console.log("[INFO]: Logged in");
        }

        let posts = [];
        let numOfPosts = 0;
        const postSelector = isFBGroup
            ? config.GROUP_POST_SELECTOR
            : config.PAGE_POST_SELECTOR;

        if (isFBGroup) console.log("[INFO]: Crawling a facebook group");
        else console.log("[INFO]: Crawling a facebook page");

        await page.keyboard.press("Space");

        while (true) {
            await scrollPageToBottom(page, { size: 200, delay: 100 });
            posts = await page.$$(postSelector);
            if (posts.length <= numOfPosts || posts.length > 20) break;
            numOfPosts = posts.length;
        }

        console.log(`[INFO]: Found ${posts.length} posts`);

        // Click on See more btn
        await page.evaluate(() => {
            const btns = document.querySelectorAll('div[role="button"]');
            Array.from(btns)
                .filter((btn) => btn.textContent === "See more")
                .forEach((btn) => btn.click());
        });

        const data = [];
        for (const [index, post] of posts.entries()) {
            let postInfo = {
                content: await getPostContent(post, isFBGroup),
            };

            // if (!isFBGroup) {
            //     const url = await getPostURL(await getEmbedContent(page, post));
            //     const id = await getPostId(url);
            //     postInfo = { ...postInfo, url, id };
            // }
            await callback(postInfo, index);
            data.push(postInfo);
        }

        return data;
    } catch (error) {
        await errorHandler(page, error);
    }
}

module.exports = getFBPosts;
