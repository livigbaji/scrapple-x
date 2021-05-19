import { Args, Query, Resolver } from '@nestjs/graphql';
import { CrawlerService } from './crawler.service';
import { Website } from './website.model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
@Resolver((of: any) => Website)
export class AppResolver {
  constructor(private readonly crawlerService: CrawlerService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query((returns) => Website)
  async website(@Args('url') url: string): Promise<Website> {
    const data = await this.crawlerService.getPage(url);

    return {
      url,
      ...data,
    };
  }
}
