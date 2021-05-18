import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Website {
  @Field()
  url: string;
  @Field()
  title: string;
  @Field()
  description: string;
  @Field()
  largestImage: string;
  //   @Field()
  //   metaData: Record<string, string>;
}
