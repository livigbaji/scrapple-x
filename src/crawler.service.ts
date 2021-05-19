import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Website } from './website.model';

type picType = { area: number; src: string };

@Injectable()
export class CrawlerService {
  /**
   * Checks if input string is a valid URL
   * @param url web URL
   * @returns
   */
  validateURL(url: string): boolean {
    try {
      const newURL = new URL(url);
      return !!newURL;
    } catch (e) {
      return false;
    }
  }

  async getPage(url: string): Promise<Website> {
    if (!this.validateURL(url)) {
      throw new Error(
        `${url} is not a valid web address. Start you web address with http:// or https://`,
      );
    }

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);

      const data = await this.getInfo(page, url);

      await browser.close();

      return data as Website;
    } catch (e) {
      // console.log(e);
      throw new Error('could not fetch page');
    }
  }

  async getInfo(
    page,
    url,
  ): Promise<Pick<Website, 'description' | 'title' | 'largestImage'>> {
    const title = await page.title();

    const description = await this.getDescription(page);

    const largestImage = await this.calculateLargestImage(page);

    return {
      title,
      largestImage: largestImage.startsWith('/')
        ? `${url}${largestImage}`
        : largestImage,
      description,
    };
  }

  async getDescription(page) {
    try {
      const description = await page.$eval(
        "head > meta[name='description']",
        (element) => element.content,
      );

      return description;
    } catch (e) {
      return '';
    }
  }

  async calculateLargestImage(page) {
    try {
      const images = await page.$$eval(
        'img,[style*="background-image"]',
        (imgs) =>
          imgs
            .map((img) => ({
              src: img.src || img.style.backgroundImage.slice(5).slice(0, -2),
              area: img.offsetWidth
                ? img.offsetWidth * img.offsetHeight
                : img.naturalWidth * img.naturalHeight,
            }))
            .filter(({ area }) => area),
      );

      const [largestImage] = Array.from(images)
        .sort((prev: picType, next: picType) => {
          return next.area - prev.area;
        })
        .map(({ src, area }) => ({ src, area }));

      return largestImage ? largestImage.src : '';
    } catch (e) {
      return '';
    }
  }
}
