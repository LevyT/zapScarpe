const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Product = require('./product');

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto('https://www.zap.co.il/models.aspx?sog=e-cellphone');

  await page.waitFor(2 * 1000);

  const PRODUCT = '#ModelsPage > div.SearchResults > div.SearchResultsMain > div:nth-child(INDEX) > div.ProdInfo > div.ProdInfoTitle > a';
  const PRICE = '#ModelsPage > div.SearchResults > div.SearchResultsMain > div:nth-child(INDEX) > div.Prices > div.pricesRow > div.pricesTxt';
  const DETAIL = '#ModelsPage > div.SearchResults > div.SearchResultsMain > div:nth-child(INDEX) > div.ProdInfo > div.ProdGeneralInfo';
  const LENGTH_SELECTOR_CLASS = 'ProdInfo';
  const numPages = await getNumPages(page);

  console.log('Numpages: ', numPages);

  for (let h = 1; h <= numPages; h++) {
     let pageUrl = page.url() + '&pageinfo=' + h;
     await page.goto(pageUrl);

    let listLength = await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, LENGTH_SELECTOR_CLASS);
    
    for (let i = 1; i <= listLength; i++) {
      // change the index to the next child
      let productSelector = PRODUCT.replace("INDEX", i);
      let priceSelector = PRICE.replace("INDEX", i);
      let infoSelector = DETAIL.replace("INDEX", i);

      try {
        let prod = await page.evaluate((sel) => {
          return document.querySelector(sel).text;
        }, productSelector);
        let pric = await page.evaluate((sel) => {
          return document.querySelector(sel).textContent.trim();
        }, priceSelector);
        let info = await page.evaluate((sel) => {
          return document.querySelector(sel).textContent.split("\n")[1].trim();
        }, infoSelector);
        console.log(prod)
        console.log(pric)
        console.log(info)
        upsertProduct({
          productname: prod,
          productdetails: info,
          price: pric,
          dateCrawled: new Date()
        });
      } catch (error) {
        console.log("Error Fetching Product Continuing")
      } 
  }}

  browser.close();
}

async function getNumPages(page) {
  const NUM_PAGE_SELECTOR = '#uc_Paginating_PageNumbers > div > a:nth-child(15)';
  let inner = await page.evaluate((sel) => {
    let html = document.querySelector(sel).href;

    return html.split("=")[2];
  }, NUM_PAGE_SELECTOR);

  const numPage = parseInt(inner);
  return numPage
}

function upsertProduct(productObj) {
  const DB_URL = 'mongodb://localhost/levyt';

  if (mongoose.connection.readyState == 0) {
    mongoose.connect(DB_URL);
  }

  // if this product exists, update the entry, don't insert
  const conditions = { productname: productObj.prod };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  Product.findOneAndUpdate(conditions, productObj, options, (err, result) => {
    if (err) {
      throw err;
    }
  });
}

run(); 
