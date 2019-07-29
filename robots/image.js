const google = require("googleapis").google;
const imageDownloader = require("image-downloader");
const customSearch = google.customsearch("v1");

const state = require("./state.js");

const { apiKey, searchEngineId } = require("../credentials/google-search.json");

async function robot() {
  const content = state.load();
  await fetchImagesOfAllSentences(content);
  await downloadAllImages(content);
  state.save(content);

  async function fetchImagesOfAllSentences(content) {
    for (const sentence of content.sentences) {
      const query = `${content.searchTerm} ${sentence.keywords[0]}`;
      sentence.images = await fetchGoogleAndReturnImagesLink(query);
      sentence.googleSearchQuery = query;
    }
  }

  async function fetchGoogleAndReturnImagesLink(query) {
    const response = await customSearch.cse.list({
      auth: apiKey,
      cx: searchEngineId,
      q: query,
      searchType: "image",
      num: 2
    });

    return response.data.items
      ? response.data.items.map(({ link }) => link)
      : [];
  }

  async function downloadAllImages(content) {
    content.downloadedImages = [];

    for (
      let sentenceIndex = 0;
      sentenceIndex < content.sentences.length;
      sentenceIndex++
    ) {
      const images = content.sentences[sentenceIndex].images;

      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        const imageUrl = images[imageIndex];

        try {
          if (content.downloadedImages.includes(imageUrl)) {
            throw new Error("This image was already downloaded");
          }
          content.downloadedImages.push(imageUrl);
          await downloadAndSaveImage(imageUrl, `${sentenceIndex}-original.png`);
          console.log(`> Image downloaded succesfully: ${imageUrl}`);
          break;
        } catch (error) {
          console.log(`> Error while downloading (${imageUrl}): ${error}`);
        }
      }
    }
  }

  async function downloadAndSaveImage(url, fileName) {
    return imageDownloader.image({
      url,
      dest: `./content/${fileName}`
    });
  }
}

module.exports = robot;
