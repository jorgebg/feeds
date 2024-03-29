const markdownIt = require("markdown-it");
const svgContents = require("eleventy-plugin-svg-contents");
const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);

module.exports = async function(eleventyConfig) {
	const md = new markdownIt({
		html: true,
	});

	eleventyConfig.addWatchTarget("./src/assets/style.css");
	eleventyConfig.addPassthroughCopy("./src/assets/");
	eleventyConfig.addPlugin(svgContents);
	eleventyConfig.addFilter("markdownify", (content) => {
		return md.render(content);
	});

	// eleventyConfig.on("eleventy.after", async ({ dir }) => {
	// 	await exec(`npx pagefind --site=${dir.output} --output-subdir=./pagefind`);
	// });


	const feeds = await require('./feeds.js');
	feeds().then(data => {

		eleventyConfig.addCollection("feedPosts", (collection) => {
			const feedData = data['all'];
			let posts = [];
			feedData.forEach(function(feed) {
				feed.items.forEach(function(item) {
					posts.push({
						content: item.content,
						title: item.title,
						date: new Date(item.date),
						link: item.link,
						author: item.author,
						feed: {
							title: feed.title,
							url: feed.url,
							description: feed.description,
							author: feed.author,
							url: feed.url,
							id: feed.id,
							categories: feed.categories
						}
					});
				});
			});
	
			return posts.sort(function(a, b) {
				return b.date - a.date;
			});
		});

		eleventyConfig.addCollection('feedCategories', (collection) => {
			return data.categories.map(category => {
				return {
					name: category
				}
			});
		});


		data.categories.forEach(function(category) {
			eleventyConfig.addCollection(`category_${category.toLowerCase()}`, (collection) => {
				let posts = [];
				return collection.getFilteredByTag("posts").filter((post) => {
					return post.data.categories.includes(category);
				});
			});
		});

		eleventyConfig.addCollection("feedsList", (collection) => {
			const feedData = data['all'];
			let f = [];
			feedData.forEach(function(feed) {
				f.push({
					title: feed.title,
					url: feed.url,
					description: feed.description,
					author: feed.author,
					url: feed.url,
					id: feed.id,
					categories: feed.categories
				});
			});

			return f;
		});

		data['all'].forEach(function(feed) {
			eleventyConfig.addCollection(`feed_${feed.id}`, (collection) => {
				let posts = [];
				return collection.getFilteredByTag("posts").filter((post) => {
					return feed.id == post.data.feedId;
				});
			});
		});
		
	});


	return {
		dir: {
			input: "src",
			output: "_site"
		}
	}
};