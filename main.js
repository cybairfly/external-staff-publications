const Apify = require('apify');
const rp = require('request-promise');

const proxyGroup = 'BUYPROXIES94952';
const sourceList = [{
  url: 'http://www.forms.fortis.com/External_Staff_Publications_EN.asp'
}]

Apify.main(async () => {
  const requestList = new Apify.RequestList({
    sources: sourceList
  });
  await requestList.initialize();

  const crawler = new Apify.PuppeteerCrawler({
    requestList,
    maxRequestsPerCrawl: 1,

    launchPuppeteerOptions: {
      useApifyProxy: true,
      apifyProxyGroups: [proxyGroup]
    },

    handlePageFunction: async ({page, request}) => {
      const title = await page.title();
      console.log('Processing page:', title);

      const response = await rp('https://api.apify.com/v2/browser-info/');
      const info = JSON.parse(response);
      console.log(`Using proxy: ${info.clientIp} (${info.countryCode})`);

      const pageFunction = ($rows) => $rows.map($row => ({
        link: $row.querySelector('td.label a').href,
        reference: $row.querySelector('td.label a').innerText,
        date: $row.querySelectorAll('td.tableCell')[1].innerText,
        position: $row.querySelectorAll('td.tableCell')[2].innerText,
        description: $row.querySelectorAll('td.tableCell')[3].innerText
      }));

      const data = await page.$$eval('table.mTable tbody tr:not(#trHeader)', pageFunction);

      console.log(`Page has been loaded: ${request.url}`);
      console.log(`Found ${data.length} items total`);

      console.log('Store data in dataset');
      Promise.all(data.map(row => Apify.pushData(row)));
    },

    handleFailedRequestFunction: async ({request}) => {
      console.log(`Request ${request.url} failed 4 times`);
    },
  });

  await crawler.run();
});