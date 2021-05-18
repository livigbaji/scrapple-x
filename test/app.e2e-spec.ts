import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Website } from 'src/website.model';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ GET web URL data', () => {
    const website: Website = {
      title: 'title',
      description: 'description',
      url: 'mehn',
      largestImage: 'largestImage',
    };

    const websiteQuery = `
      query {
        website(url: "love.com") {
          title
          description
          url
          largestImage
        }
      }
    `;

    return request(app.getHttpServer())
      .post('/')
      .send({
        operationName: null,
        query: websiteQuery,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveProperty('website');
        expect(website).toEqual(website);
      });
  });
});
