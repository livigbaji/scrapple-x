import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as axios from 'axios';
import { pickBy } from 'lodash';
import { Website } from './website.model';

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
      const { data } = await axios.default.get(url, {
        headers: {
          'Content-Type': 'text/html',
        },
      });

      return this.getInfo(data as string) as Website;
    } catch (e) {
      console.log(e);
      throw new Error('could not fetch page');
    }
  }

  getInfo(
    html: string,
  ): Pick<Website, 'description' | 'metaData' | 'title' | 'largestImage'> {
    const $ = cheerio.load(html);
    const title = $('title').text();
    const metaData = this.metaTagsToObject(Array.from($('meta')));
    return {
      title,
      largestImage:
        (JSON.parse(metaData) as Partial<{ 'og:image': string }>)['og:image'] ||
        '',
      description:
        (JSON.parse(metaData) as Partial<{ description: string }>)
          .description || '',
      metaData: metaData,
    };
  }

  metaTagsToObject(meta: cheerio.Element[]): string {
    const metaAttributes = meta.map(({ attribs }) => attribs);

    return JSON.stringify(
      metaAttributes.reduce(
        (object, { name, content, value, property, charset }) =>
          pickBy(
            Object.assign(
              {},
              object,
              (property || name) && {
                [property || name]: value || content,
              },
              charset && {
                charset,
              },
            ),
          ),
        {},
      ),
    );
  }
}
