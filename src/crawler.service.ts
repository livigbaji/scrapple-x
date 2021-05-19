import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Website } from './website.model';

type picType = { naturalHeight: number; naturalWidth: number };

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
      throw new Error(`${url} is not a valid URL(web address)`);
    }

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);

      const data = await this.getInfo(page);

      await browser.close();

      return data as Website;
    } catch (e) {
      console.log(e);
      throw new Error('could not fetch page');
    }
  }

  async getInfo(
    page,
  ): Promise<Pick<Website, 'description' | 'title' | 'largestImage'>> {
    const title = await page.title();
    const description = await page.$eval(
      "head > meta[name='description']",
      (element) => element.content,
    );
    const images = await page.$$eval('img', (imgs) =>
      imgs.map((img) => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      })),
    );

    const largestImage = this.calculateLargestImage(images);

    return {
      title,
      largestImage,
      description,
    };
  }

  calculateLargestImage(images: any) {
    // console.log(images);
    const [largestImage] = Array.from(images)
      .filter(
        ({ naturalWidth, naturalHeight }) => naturalWidth && naturalHeight,
      )
      .sort((prev: picType, next: picType) => {
        return (
          next.naturalHeight * next.naturalWidth -
          prev.naturalHeight * prev.naturalWidth
        );
      })
      .map(({ src, naturalHeight, naturalWidth }) => ({
        src,
        naturalHeight,
        naturalWidth,
      }));

    return largestImage ? largestImage.src : '';
  }
}
