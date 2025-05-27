import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';

export interface LandstarLoad {
  agency: string;
  pickup: string;
  origin: string;
  destination: string;
  trailerType: string;
  miles: string;
  weight: string;
  commodity: string;
}

@Injectable()
export class LandstarService {
  private readonly logger = new Logger(LandstarService.name);
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 180000; // 3 minutes

  async scrapeLandstarLoads(): Promise<LandstarLoad[]> {
    let retries = 0;
    let browser;

    while (retries < this.MAX_RETRIES) {
      try {
        this.logger.log(`Attempt ${retries + 1} of ${this.MAX_RETRIES}`);

        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080',
          ],
          executablePath: process.env.CHROME_BIN || '/usr/bin/chromium',
          timeout: this.TIMEOUT,
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setDefaultNavigationTimeout(this.TIMEOUT);

        this.logger.log('Navigating to Landstar loadboard...');
        await page.goto('https://www.landstaronline.com/loadspublic', {
          waitUntil: 'networkidle2',
          timeout: this.TIMEOUT,
        });

        this.logger.log('Filling search form...');
        await page.waitForSelector('#TxtOriginControl');
        await page.type('#TxtOriginControl', 'FL');

        await page.waitForSelector('#TxtDestinationControl');
        await page.type('#TxtDestinationControl', 'MA');

        this.logger.log('Submitting search...');
        await page.waitForSelector('#searchButtonDiv');
        await page.click('#searchButtonDiv');

        this.logger.log('Waiting for results...');
        await page.waitForSelector('#Loads > table > tbody > tr', {
          timeout: this.TIMEOUT,
        });

        const data = await page.evaluate(() => {
          const rows = Array.from(
            document.querySelectorAll('#Loads > table > tbody > tr'),
          );

          return rows.map((row) => {
            const cells = row.querySelectorAll('td');

            return {
              agency: cells[2]?.innerText.trim(),
              pickup: cells[3]?.innerText.trim(),
              origin: cells[4]?.innerText.split('\n')[0]?.trim(),
              destination: cells[4]?.innerText.split('\n')[1]?.trim(),
              trailerType: cells[5]?.innerText.trim(),
              miles: cells[7]?.innerText.trim(),
              weight: cells[8]?.innerText.trim().split('\n')[0],
              commodity: cells[9]?.innerText.trim(),
            };
          });
        });

        this.logger.log(`Successfully extracted ${data.length} loads`);
        await browser.close();
        return data;
      } catch (error) {
        this.logger.error(`Error on attempt ${retries + 1}: ${error.message}`);
        if (browser) {
          await browser.close();
        }
        retries++;
        if (retries === this.MAX_RETRIES) {
          throw new Error(
            `Failed to scrape Landstar loads after ${this.MAX_RETRIES} attempts: ${error.message}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 5000 * retries));
      }
    }
    throw new Error('Failed to scrape Landstar loads after all retries');
  }
}
