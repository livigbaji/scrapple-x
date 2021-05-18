import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot({
      path: '/',
      autoSchemaFile: 'schema.gql',
      playground: true,
      introspection: true,
    }),
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}
