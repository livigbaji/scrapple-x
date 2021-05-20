import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Website } from './website.model';

export type picType = { area: number; src: string };
export type imageType = {
  src?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  style?: { backgroundImage: string };
  offsetWidth?: number;
  offsetHeight?: number;
};

@Injectable()
export class CrawlerService {
  cacheMap = new Map<string, { data: Website; time: number }>();
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

  /**
   * checks if url is present in cache for not more than 30 minutes
   * @param url
   * @returns
   */
  hasResentCache(url: string) {
    if (!this.cacheMap.has(url)) {
      return null;
    }

    const { time, data } = this.cacheMap.get(url);
    const timeElapsed = Math.floor(Math.floor((Date.now() - time) / 1000) / 60);

    if (timeElapsed > 30) {
      return null;
    }

    return data;
  }

  /**
   * fetches a page and returns its largest image, description and title
   * @param url
   * @returns
   */
  async getPage(url: string): Promise<Website> {
    if (!this.validateURL(url)) {
      throw new Error(
        `${url} is not a valid web address. Start you web address with http:// or https://`,
      );
    }

    const recentCache = this.hasResentCache(url);

    if (recentCache) {
      return recentCache;
    }

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto(url);

      const data = await this.getInfo(page, url);

      await browser.close();

      this.cacheMap.set(url, {
        data,
        time: Date.now(),
      });

      return data as Website;
    } catch (e) {
      // console.log(e);
      throw new Error('could not fetch page');
    }
  }

  /**
   * gets a webpage description, title and largest image
   * @param page
   * @param url
   * @returns
   */
  async getInfo(
    page: puppeteer.Page,
    url: string,
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

  /**
   * returns the content from a meta element
   * @param element
   * @returns
   */
  descriptionCallback(element: HTMLMetaElement): string {
    return element.content;
  }

  /**
   * gets the meta description of a page
   * @param page
   * @returns
   */
  async getDescription(page: puppeteer.Page): Promise<string> {
    try {
      const description = await page.$eval(
        "head > meta[name='description']",
        this.descriptionCallback,
      );

      return description;
    } catch (e) {
      return '';
    }
  }

  /**
   * filter images to return the images with an area
   * @param imgs
   * @returns
   */
  imageFilter(imgs: Array<HTMLElement | HTMLImageElement>): picType[] {
    return imgs
      .map((img) => {
        if (img.hasAttribute('src')) {
          return {
            src: (img as HTMLImageElement).src,
            area:
              (img as HTMLImageElement).naturalWidth *
              (img as HTMLImageElement).naturalHeight,
          };
        } else {
          img = img as HTMLElement;
          return {
            src: img.style.backgroundImage.slice(5).slice(0, -2),
            area: img.offsetWidth * img.offsetHeight,
          };
        }
      })
      .filter(({ area }) => area);
  }

  /**
   * calculates the largest image on page using their areas
   * @param page
   * @returns
   */
  async calculateLargestImage(page: puppeteer.Page): Promise<string> {
    try {
      const images = await page.$$eval(
        'img,[style*="background-image"]',
        this.imageFilter,
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
