import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '../jwt/jwt.service';
import { MailService } from '../mail/mail.service';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  const mockRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOneOrFail: jest.fn(),
    delete: jest.fn(),
  });

  const mockJwtService = () => ({
    sign: jest.fn(() => 'token'),
    verify: jest.fn(),
  });

  const mockMailService = () => ({
    sendVerificationEmail: jest.fn(),
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createUserArgs = {
      email: 'test',
      password: '1234',
      role: 0,
    };

    it('should create a user', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(createUserArgs);
      usersRepository.save.mockResolvedValue(createUserArgs);
      verificationRepository.create.mockReturnValue({ user: createUserArgs });
      verificationRepository.save.mockResolvedValue({
        code: 'code',
      });

      const result = await service.createUser(createUserArgs);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createUserArgs);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createUserArgs);

      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: createUserArgs,
      });

      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith({
        user: createUserArgs,
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test',
      });

      const result = await service.createUser(createUserArgs);

      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());

      const result = await service.createUser(createUserArgs);
      expect(result).toEqual({ ok: false, error: "Couldn't create user" });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'test',
      password: '1234',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: "Couldn't find user",
      });
    });

    it('should fail if password is wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };

      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);

      expect(result).toEqual({
        ok: false,
        error: 'Check your email and password',
      });
    });

    it('should return a token if password is correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };

      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({ ok: true, token: 'token' });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockResolvedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });

  describe('userProfile', () => {
    it('should find an existing user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue({ id: 1 });
      const result = await service.userProfile(1);
      expect(result).toEqual({
        ok: true,
        user: { id: 1 },
      });
    });

    it('should fail if user not found', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.userProfile(1);
      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });
  });

  describe('editProfile', () => {
    it('should change an email', async () => {
      const oldUser = {
        email: 'test',
        verified: true,
      };

      const editProfileArgs = {
        id: 1,
        input: { email: 'test2' },
      };

      const newVerfication = {
        code: 'code',
      };

      const newUser = {
        email: editProfileArgs.input.email,
        verified: false,
      };

      usersRepository.findOneOrFail.mockResolvedValue(oldUser);
      verificationRepository.create.mockReturnValue(newVerfication);
      verificationRepository.save.mockResolvedValue(newVerfication);

      await service.editProfile(editProfileArgs.id, editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        id: editProfileArgs.id,
      });

      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationRepository.save).toHaveBeenCalledWith(newVerfication);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerfication.code,
      );
    });

    it('should not change a email if email is already in use', async () => {
      const oldUser = {
        email: 'test',
        verified: true,
      };

      const anotherUser = {
        email: 'test2',
      };

      const editProfileArgs = {
        id: 1,
        input: { email: 'test2' },
      };

      usersRepository.findOneOrFail.mockResolvedValue(oldUser);
      usersRepository.findOne.mockResolvedValue(anotherUser);

      const result = await service.editProfile(
        editProfileArgs.id,
        editProfileArgs.input,
      );

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        email: editProfileArgs.input.email,
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Email is already in use');
    });

    it('should change a password', async () => {
      const oldUser = {
        password: 'old-password',
      };

      const editProfileArgs = {
        id: 1,
        input: {
          password: 'new-password',
        },
      };

      usersRepository.findOneOrFail.mockResolvedValue(oldUser);

      const result = await service.editProfile(
        editProfileArgs.id,
        editProfileArgs.input,
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgs.input);

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());

      const result = await service.editProfile(1, { email: 'whatever' });

      expect(result).toEqual({ ok: false, error: expect.any(Error) });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      verificationRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail({ code: 'code' });

      expect(verificationRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(usersRepository.save).toHaveBeenCalledWith({
        verified: true,
      });
      expect(verificationRepository.delete).toHaveBeenCalledWith({
        id: mockedVerification.id,
      });
      expect(result).toEqual({ ok: true });
    });

    it('should fail if verification not found', async () => {
      verificationRepository.findOne.mockResolvedValue(null);
      const result = await service.verifyEmail({ code: 'code' });
      expect(result).toEqual({
        ok: false,
        error: 'Verification not found',
      });
    });

    it('should fail on exception', async () => {
      verificationRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail({ code: 'code' });
      expect(result).toEqual({
        ok: false,
        error: expect.any(Error),
      });
    });
  });
});
