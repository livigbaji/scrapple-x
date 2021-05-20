import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from './crawler.service';
import * as puppeteer from 'puppeteer';

describe('CrawlerService', () => {
  let service: CrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlerService],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
  });

  describe('validateURL method', () => {
    it('returns true when URL is valid', () => {
      const results = service.validateURL('https://www.example.com');
      expect(results).toBe(true);
    });

    it('returns false when URL is invalid', () => {
      const results = service.validateURL('randomstuff');
      expect(results).toBe(false);
    });
  });

  describe('hasResentCache', () => {
    it('returns null if url is not in cache', () => {
      const results = service.hasResentCache('nonexistent');
      expect(results).toBe(null);
    });

    it('returns null if cache is older than 30 minutes', () => {
      const moreThan30MinutesAgo = Date.now() - 1000 * 60 * 32;
      service.cacheMap.set('legiturl', {
        data: {
          title: 'doesnt matter',
          description: 'no one cares',
          largestImage: 'boo',
          url: 'yeay',
        },
        time: moreThan30MinutesAgo,
      });
      const results = service.hasResentCache('legiturl');
      expect(results).toBe(null);
    });

    it('returns website if cache is not older than 30 minutes', () => {
      const lessThan30MinutesAgo = Date.now() - 1000 * 60 * 15;
      service.cacheMap.set('legiturlwithsauce', {
        data: {
          title: 'doesnt matter',
          description: 'no one cares',
          largestImage: 'boo',
          url: 'yeay',
        },
        time: lessThan30MinutesAgo,
      });
      const results = service.hasResentCache('legiturlwithsauce');
      expect(results).toEqual({
        title: 'doesnt matter',
        description: 'no one cares',
        largestImage: 'boo',
        url: 'yeay',
      });
    });
  });

  describe('getDescription method', () => {
    it('descriptionCallback', () => {
      const element = { content: 'boo!!!' };
      const result = service.descriptionCallback(element);
      expect(result).toBe('boo!!!');
    });

    it('returns page description off meta', async () => {
      // const mockCallback = jest.fn((o) => o.content);
      const evalMock = jest.fn().mockResolvedValue('hello');
      const page = { $eval: evalMock };
      const result = await service.getDescription(page);

      expect(result).toBe('hello');
    });

    it('returns empty string if no description is found', async () => {
      const evalMock = jest.fn().mockRejectedValueOnce('hello error');
      const page = { $eval: evalMock };
      const result = await service.getDescription(page);

      expect(result).toBe('');
    });
  });

  describe('calculateLargestImage method', () => {
    it('imageFilter returns image that has area', () => {
      const result = service.imageFilter([
        { naturalHeight: 10, naturalWidth: 30, src: 'hello' },
        {
          offsetHeight: 20,
          offsetWidth: 40,
          style: { backgroundImage: 'url("halo")' },
        },
      ]);
      expect(result).toEqual([
        { area: 10 * 30, src: 'hello' },
        { area: 20 * 40, src: 'halo' },
      ]);
    });
    it('returns image with the largest area', async () => {
      const evalMock = jest.fn().mockResolvedValueOnce([
        { src: 'imageOfAsgard', area: 2 },
        { src: 'imageOfTital', area: 1 },
      ]);
      const page = { $$eval: evalMock };
      const result = await service.calculateLargestImage(page);

      expect(result).toBe('imageOfAsgard');
    });

    it('returns empty string if there are no image', async () => {
      const evalMock = jest.fn().mockRejectedValueOnce([]);
      const page = { $$eval: evalMock };
      const result = await service.calculateLargestImage(page);

      expect(result).toBe('');
    });

    it('returns empty string if imageFilter returns null or undefined', async () => {
      const evalMock = jest.fn().mockResolvedValueOnce([]);
      const page = { $$eval: evalMock };
      const result = await service.calculateLargestImage(page);

      expect(result).toBe('');
    });
  });

  describe('getInfo method', () => {
    it('returns title, largestImage and description from page', async () => {
      const titleMock = jest.fn().mockResolvedValueOnce('I love cookies');
      const page = { title: titleMock };
      const getDescriptionSpy = jest
        .spyOn(service, 'getDescription')
        .mockResolvedValueOnce('description');

      const calculateLargestImageSpy = jest
        .spyOn(service, 'calculateLargestImage')
        .mockResolvedValueOnce('largest.image');
      const result = await service.getInfo(page, 'hello');

      expect(result).toEqual({
        title: 'I love cookies',
        description: 'description',
        largestImage: 'largest.image',
      });

      expect(calculateLargestImageSpy).toBeCalled();
      expect(getDescriptionSpy).toBeCalled();
      expect(titleMock).toBeCalled();
    });

    it('appends URL to largestImage if it is a path', async () => {
      const titleMock = jest.fn().mockResolvedValueOnce('I love cookies');
      const page = { title: titleMock };
      const getDescriptionSpy = jest
        .spyOn(service, 'getDescription')
        .mockResolvedValueOnce('description');

      const calculateLargestImageSpy = jest
        .spyOn(service, 'calculateLargestImage')
        .mockResolvedValueOnce('/largest.image');
      const result = await service.getInfo(page, 'hello');

      expect(result).toEqual({
        title: 'I love cookies',
        description: 'description',
        largestImage: 'hello/largest.image',
      });

      expect(calculateLargestImageSpy).toBeCalled();
      expect(getDescriptionSpy).toBeCalled();
      expect(titleMock).toBeCalled();
    });
  });

  describe('getPage method', () => {
    it('returns cached data if not null', async () => {
      const url = 'randokpako';

      const validateSpy = jest
        .spyOn(service, 'validateURL')
        .mockReturnValueOnce(true);

      const cacheSpy = jest
        .spyOn(service, 'hasResentCache')
        .mockReturnValueOnce({
          title: 'I love cookies',
          description: 'description',
          largestImage: 'hello/largest.image',
        });

      const results = await service.getPage(url);
      expect(results).toEqual({
        title: 'I love cookies',
        description: 'description',
        largestImage: 'hello/largest.image',
      });
      expect(cacheSpy).toBeCalledWith(url);
      expect(validateSpy).toBeCalledWith(url);
    });

    it('throws error if URL is invalid', async () => {
      const url = 'randokpako';

      const validateSpy = jest
        .spyOn(service, 'validateURL')
        .mockReturnValueOnce(false);

      try {
        await service.getPage(url);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual(
          `${url} is not a valid web address. Start you web address with http:// or https://`,
        );

        expect(validateSpy).toBeCalled();
      }
    });

    it('throws error if error occured while loading the page', async () => {
      const url = 'randokpako';

      const validateSpy = jest
        .spyOn(service, 'validateURL')
        .mockReturnValueOnce(true);

      const gotoFn = jest.fn().mockRejectedValueOnce('for some reason');
      const newPageFn = jest.fn().mockResolvedValueOnce({ goto: gotoFn });

      const lauchSpy = jest.spyOn(puppeteer, 'launch').mockResolvedValueOnce({
        newPage: newPageFn,
      } as unknown as puppeteer.Browser);

      try {
        await service.getPage(url);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual('could not fetch page');
        expect(newPageFn).toBeCalled();
        expect(gotoFn).toBeCalled();
        expect(validateSpy).toBeCalled();
        expect(lauchSpy).toBeCalled();
      }
    });
  });

  it('returns website data if page loaded successfully', async () => {
    const url = 'https://avengers.com';

    const gotoFn = jest.fn();
    const newPageFn = jest.fn().mockResolvedValueOnce({ goto: gotoFn });
    const closeFn = jest.fn().mockResolvedValueOnce(false);

    const lauchSpy = jest.spyOn(puppeteer, 'launch').mockResolvedValueOnce({
      newPage: newPageFn,
      close: closeFn,
    } as unknown as puppeteer.Browser);

    const validateSpy = jest
      .spyOn(service, 'validateURL')
      .mockReturnValueOnce(true);

    const infoSpy = jest.spyOn(service, 'getInfo').mockResolvedValueOnce({
      title: 'Hello world',
      description: 'Description of the world',
      largestImage: 'image.jpeg',
    });

    const result = await service.getPage(url);

    expect(result).toEqual({
      title: 'Hello world',
      description: 'Description of the world',
      largestImage: 'image.jpeg',
    });

    expect(infoSpy).toBeCalled();
    expect(validateSpy).toBeCalled();
    expect(newPageFn).toBeCalled();
    expect(gotoFn).toBeCalled();
    expect(closeFn).toBeCalled();
    expect(lauchSpy).toBeCalled();
  });
});
