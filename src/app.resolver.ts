import { Args, Query, Resolver } from '@nestjs/graphql';
import { Website } from './website.model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
@Resolver((of: any) => Website)
export class AppResolver {
  @Query((returns) => Website)
  async website(@Args('url') url: string): Promise<Website> {
    return {
      url,
      title: 'title',
      description: 'description',
      largestImage: 'largestImage',
      //   metaData: {
      //     hello: 'ha',
      //   },
    };
  }
}
