import getFBPosts from "./crawler.js";
import { extractPostInfo } from "./ai.js";
import { writeFileSync } from "fs";

if (process.argv.length > 2) {
    const pageURL = process.argv[2];
    const numOfPosts = process.argv[3] * 1;

    console.log("Getting posts from " + pageURL);
    const posts = await getFBPosts(pageURL, numOfPosts);

    console.log("Extracting post info");
    for (const post of posts) {
        const { price, address, contact } = JSON.parse(
            await extractPostInfo(post.content)
        );
        post.price = price;
        post.address = address;
        post.contact = contact;
    }

    writeFileSync("posts.json", JSON.stringify(posts));
} else {
    console.log("ERROR: Please specify the page URL");
}
