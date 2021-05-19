import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class WebsiteError {
  @Field()
  message: string;
}

@ObjectType()
export class Website {
  @Field()
  url?: string;
  @Field()
  title: string;
  @Field({ defaultValue: '' })
  description: string;
  @Field({ nullable: true })
  largestImage?: string;
}
