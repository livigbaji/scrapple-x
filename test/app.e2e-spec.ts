import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Website } from 'src/website.model';

jest.setTimeout(20000);

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

  it('/ POST web URL data', () => {
    const url = 'https://bestbrain10.github.io';

    const website: Website = {
      title: 'Livinus Igbaji Oga- ifu',
      description: 'Livnus Igbaji Oga-ifu personal portfolio',
      url,
      largestImage: 'https://bestbrain10.github.io/assets/img/img-profile.jpg',
    };

    const websiteQuery = `
      query {
        website(url: "${url}") {
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
