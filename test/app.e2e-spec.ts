import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRPAHQL_ENDPOINT = '/graphql';
const TEST_EMAIL = 'amthetop21@gmail.com';
const TEST_PASSWORD = '1234';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let userRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;

  const baseTest = () => request(app.getHttpServer()).post(GRPAHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest()
      .set('X-JWT', jwtToken)
      .send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createUser', () => {
    it('should create a user', () => {
      return publicTest(`
        mutation {
          createUser(
            input: { email: "${TEST_EMAIL}", password: "${TEST_PASSWORD}", role: Client }
          ) {
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              createUser: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(true);
          expect(error).toBeNull();
        });
    });

    it('should fail if user already exists', () => {
      return publicTest(`
        mutation {
          createUser(
            input: { email: "${TEST_EMAIL}", password: "${TEST_PASSWORD}", role: Client }
          ) {
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              createUser: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(false);
          expect(error).toBe('There is a user with that email already');
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`
          mutation {
            login(input: { email: "${TEST_EMAIL}", password: "${TEST_PASSWORD}" }) {
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              login: { ok, error, token },
            },
          } = res.body;

          jwtToken = token;
          expect(ok).toBe(true);
          expect(error).toBeNull();
          expect(token).toEqual(expect.any(String));
        });
    });

    it('should not login if user not found', () => {
      return publicTest(`
          mutation {
            login(input: { email: "lalaall", password: "lalalal" }) {
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              login: { ok, error, token },
            },
          } = res.body;
          expect(ok).toBe(false);
          expect(error).toBe("Couldn't find user");
          expect(token).toBeNull();
        });
    });

    it('should not login with wrong password', () => {
      return publicTest(`
          mutation {
            login(input: { email: "${TEST_EMAIL}", password: "lalalal" }) {
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              login: { ok, error, token },
            },
          } = res.body;
          expect(ok).toBe(false);
          expect(error).toBe('Check your email and password');
          expect(token).toBeNull();
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;

    beforeAll(async () => {
      const [user] = await userRepository.find();
      userId = user.id;
    });

    it('should return a user', () => {
      return privateTest(`
          query {
            userProfile(id: ${userId}) {
              ok
              error
              user {
                id
              }
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              userProfile: {
                ok,
                error,
                user: { id },
              },
            },
          } = res.body;
          expect(ok).toBe(true);
          expect(error).toBeNull();
          expect(id).toBe(userId);
        });
    });

    it('should fail if user not exists', () => {
      return privateTest(`
          query {
            userProfile(id: 2) {
              ok
              error
              user {
                id
              }
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              userProfile: { ok, error, user },
            },
          } = res.body;
          expect(ok).toBe(false);
          expect(error).toBe('User not found');
          expect(user).toBeNull();
        });
    });
  });

  describe('me', () => {
    it('should return my profile', () => {
      return privateTest(`
          query {
            me {
              email
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              me: { email },
            },
          } = res.body;
          expect(email).toEqual(TEST_EMAIL);
        });
    });

    it('should not allow logged out user', () => {
      return publicTest(`
          query {
            me {
              email
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const { data, errors } = res.body;
          const [error] = errors;
          expect(data).toBeNull();
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'kkj@gwang.jo';
    it('should change email', () => {
      return privateTest(`
          mutation {
            editProfile(input: { email: "${NEW_EMAIL}" }) {
              ok
              error
            }
          }        
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              editProfile: { ok, error },
            },
          } = res.body;

          expect(ok).toBe(true);
          expect(error).toBeNull();
        });
    });

    it('should have new email', () => {
      return privateTest(`
          query {
            me {
              email
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              me: { email },
            },
          } = res.body;
          expect(email).toEqual(NEW_EMAIL);
        });
    });
  });
  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return publicTest(`
        mutation {
          verifyEmail(input: {
            code: "${verificationCode}"
          }){
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              verifyEmail: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(true);
          expect(error).toBeNull();
        });
    });
    it('should fail on wrong verification code', () => {
      return publicTest(`
          mutation {
            verifyEmail(input: {
              code: "llalalaal"
            }){
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            data: {
              verifyEmail: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(false);
          expect(error).toBe('Verification not found');
        });
    });
  });
});
