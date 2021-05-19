import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { CrawlerService } from './crawler.service';
import { AppResolver } from './app.resolver';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

@Module({
  imports: [
    GraphQLModule.forRoot({
      path: '/',
      autoSchemaFile: 'schema.gql',
      playground: true,
      introspection: true,
      formatError: (error: GraphQLError) => {
        console.log(error);
        const graphQLFormattedError: GraphQLFormattedError = {
          message:
            error.extensions?.exception?.response?.message || error.message,
        };
        return graphQLFormattedError;
      },
    }),
  ],
  providers: [CrawlerService, AppResolver],
})
export class AppModule {}
