import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';

export interface LoadInfo {
  origin: string;
  pickupTime: string;
  destination: string;
  deliveryTime: string;
  route: string;
  loadedWeight: string;
  equipment: string;
}

@Injectable()
export class JbhuntService {
  private readonly logger = new Logger(JbhuntService.name);
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 180000; // 3 minutes

  async scrapeJbhuntLoads(): Promise<LoadInfo[]> {
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
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setDefaultNavigationTimeout(this.TIMEOUT);

        this.logger.log('Navigating to JB Hunt loadboard...');
        await page.goto(
          'https://www.jbhunt.com/loadboard/load-board/grid?origin=OH&originState=Ohio&originStateCode=OH&deadheadOrigin=100&deadheadDestination=100&page=0&pageSize=100&earliestStartDate=2025-05-22&maxWeight=100000',
          {
            waitUntil: 'networkidle2',
            timeout: this.TIMEOUT,
          },
        );

        this.logger.log('Waiting for table rows...');
        await page.waitForSelector('[data-cy="lb-table-row"]', {
          timeout: this.TIMEOUT,
        });
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const loads = await page.$$eval('[data-cy="lb-table-row"]', (rows) =>
          rows.slice(0, 20).map((row) => {
            const getData = (tdId: string) => {
              const td = row.querySelector(`td#${tdId}`);
              const span = td?.querySelector('span');
              const location =
                td
                  ?.querySelector('div.jds-d-inline-flex')
                  ?.textContent?.trim() || '';
              const texts = Array.from(span?.childNodes || [])
                .filter((n: Node) => n.nodeType === Node.TEXT_NODE)
                .map((n: Node) => n.textContent?.trim())
                .filter(Boolean);

              const [date, time] = texts;
              return {
                location,
                datetime: [date, time].filter(Boolean).join(' '),
              };
            };

            const getTextOnly = (tdId: string): string => {
              const td = row.querySelector(`td#${tdId}`);
              return td?.textContent?.trim().replace(/\s+/g, ' ') || '';
            };

            const pickup = getData('pickup');
            const delivery = getData('delivery');
            const route = getTextOnly('route');
            const loadedWeight = getTextOnly('loadedWeight');
            const equipment = getTextOnly('equipment');

            return {
              origin: pickup.location,
              pickupTime: pickup.datetime,
              destination: delivery.location,
              deliveryTime: delivery.datetime,
              route,
              loadedWeight,
              equipment,
            };
          }),
        );

        this.logger.log(`Successfully extracted ${loads.length} loads`);
        await browser.close();
        return loads;
      } catch (error) {
        this.logger.error(`Error on attempt ${retries + 1}: ${error.message}`);
        if (browser) {
          await browser.close();
        }
        retries++;
        if (retries === this.MAX_RETRIES) {
          throw new Error(
            `Failed to scrape JB Hunt loads after ${this.MAX_RETRIES} attempts: ${error.message}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 5000 * retries));
      }
    }
    throw new Error('Failed to scrape JB Hunt loads after all retries');
  }
}
