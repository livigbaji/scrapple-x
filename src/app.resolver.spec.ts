import { Test, TestingModule } from '@nestjs/testing';
import { AppResolver } from './app.resolver';
import { CrawlerService } from './crawler.service';

describe('AppResolver', () => {
  let resolver: AppResolver;
  let service: CrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppResolver, CrawlerService],
    }).compile();

    resolver = module.get<AppResolver>(AppResolver);
    service = module.get<CrawlerService>(CrawlerService);
  });

  it('returns URL data from webcrawler service', async () => {
    const url = 'https://avengers.com';
    const crawlerSpy = jest.spyOn(service, 'getPage').mockResolvedValueOnce({
      largestImage: 'largest.image',
      title: 'title larger',
      description: 'hello world, I describe',
    });

    const results = await resolver.website(url);
    expect(crawlerSpy).toBeCalledWith(url);
    expect(results).toEqual({
      url,
      largestImage: 'largest.image',
      title: 'title larger',
      description: 'hello world, I describe',
    });
  });

  it('escalates errors gotten from scrapping', async () => {
    const url = 'https://avengers.com';
    const crawlerSpy = jest
      .spyOn(service, 'getPage')
      .mockRejectedValueOnce({ message: 'error' });

    try {
      await resolver.website(url);
    } catch (e) {
      expect(crawlerSpy).toBeCalledWith(url);
      expect(e).toEqual({ message: 'error' });
    }
  });
});
