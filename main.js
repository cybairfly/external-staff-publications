const Apify = require('apify');

const proxyGroup = 'BUYPROXIES94952';
const urlToCrawl = 'http://www.forms.fortis.com/External_Staff_Publications_EN.asp';

Apify.main(async () => {
  const browser = await Apify.launchPuppeteer({
    proxyUrl: Apify.getApifyProxyUrl({
      groups: [proxyGroup]
    })
  });

  const pageFunction = ($rows) => $rows.map($row => ({
    link: $row.querySelector('td.label a').href,
    reference: $row.querySelector('td.label a').innerText,
    date: $row.querySelectorAll('td.tableCell')[1].innerText,
    position: $row.querySelectorAll('td.tableCell')[2].innerText,
    description: $row.querySelectorAll('td.tableCell')[3].innerText
  }));

  const page = await browser.newPage();
  page.on('load', () => console.log(`Page loaded: ${page.url()}`));
  await page.goto(urlToCrawl);

  const title = await page.title();
  console.log('Page title:', title);

  const data = await page.$$eval('table.mTable tbody tr:not(#trHeader)', pageFunction);
  console.log(`Found ${data.length} items total`);

  for (let row of data) await Apify.pushData(row);
  console.log('Data stored in dataset');

  await browser.close();
  console.log('Task has been finished');
});