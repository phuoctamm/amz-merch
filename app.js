require('chromedriver');
const fs = require('fs');
const { Builder, By } = require('selenium-webdriver');
const https = require('https');
const Stream = require('stream').Transform;

(async () => {
  try {
    const sites = fs.readFileSync('./site.txt', 'utf8');
    const sitesDone = fs.readFileSync('./done.txt', 'utf8');

    const siteJson = sites
      .trim()
      .split('\n')
      .filter((item) => item);
    const siteDoneJson = sitesDone
      .trim()
      .split('\n')
      .filter((item) => item);

    const listSites = [];

    for (const site of siteJson) {
      if (!siteDoneJson.includes(site)) {
        listSites.push(site);
      }
    }

    console.log('site:', listSites.length);

    if (!listSites.length) {
      console.log('ko co site de chay! tien trinh dung lai');
      return false;
    }

    const driver = await new Builder().forBrowser('chrome').build();

    let success = 1;

    for (const site of listSites) {
      try {
        await driver.get(site);
        await timeout(1000);
        const element = await driver.findElement(By.css('body'));
        const html = await element.getAttribute('innerHTML');
        const matchHiresImg = html.match(/{"hiRes":"(.*?)",/);
        const urlImage = matchHiresImg[1];

        const title = await driver.findElement(By.id('productTitle'));
        const titleText = await (await title.getText()).trim();
        console.log(urlImage);
        const urlImageLink = decodeURIComponent(urlImage);
        const matchUrl = urlImageLink.match(/\/(.*?)\|(.*?)\|(.*?)\|/);
        const logoPath = matchUrl[3];
        const urlLogo = `https://m.media-amazon.com/images/I/${logoPath}`;
        https
          .request(urlLogo, function (response) {
            const data = new Stream();

            response.on('data', function (chunk) {
              data.push(chunk);
            });

            response.on('end', function () {
              const fileName = titleText.replace(/[/\\?%*:|"<>]/g, '-');
              fs.appendFileSync('./done.txt', `${site}\n`);
              fs.writeFileSync(`./images/${fileName}${gfg()}.png`, data.read());

              console.log('success:', success);
              success += 1;
            });
          })
          .end();
      } catch (err) {
        console.error(err);
      }
    }

    await timeout(1000);
    await driver.quit();
    console.log('DONE!');
  } catch (e) {
    console.error(e);
  }
})();

function timeout(ms = 2000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gfg() {
  var minm = 100;
  var maxm = 999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
}
