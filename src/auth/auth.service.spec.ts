import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';

enum Role {
  ORGANIZER = 'ORGANIZER',
  CLIENT = 'CLIENT',
  GATEKEEPER = 'GATEKEEPER',
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let authRepository: AuthRepository;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    role: Role.CLIENT,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            getUserByEmail: jest.fn(),
            isMatchForPassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            createSession: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    authRepository = module.get<AuthRepository>(AuthRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should call usersService.create with the correct data', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password',
        username: 'testuser',
        role: Role.CLIENT,
      };
      await service.signUp(signupDto);
      expect(usersService.create).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('signIn', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(null);
      await expect(
        service.signIn({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'isMatchForPassword').mockReturnValue(false);
      await expect(
        service.signIn({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return a token and create a session on successful sign-in', async () => {
      const token = 'test-token';
      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'isMatchForPassword').mockReturnValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.signIn({
        email: 'test@example.com',
        password: 'password',
      });

      expect(usersService.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(usersService.isMatchForPassword).toHaveBeenCalledWith(
        mockUser,
        'password',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: String(mockUser.id),
      });
      expect(authRepository.createSession).toHaveBeenCalledWith(
        mockUser.id,
        token,
      );
      expect(result).toEqual({ token });
    });
  });

  describe('createToken', () => {
    it('should call jwtService.sign with the correct payload', () => {
      const token = 'test-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = service.createToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: String(mockUser.id),
      });
      expect(result).toEqual({ token });
    });
  });

  describe('checkToken', () => {
    it('should call jwtService.verify with correct parameters', () => {
      const token = 'test-token';
      const decoded = { sub: '1', email: 'test@example.com' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(decoded);

      const result = service.checkToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        audience: 'users',
        issuer: 'Fabricio',
      });
      expect(result).toEqual(decoded);
    });

    it('should throw BadRequestException if token is invalid', () => {
      const token = 'invalid-token';
      jest
        .spyOn(jwtService, 'verify')
        .mockImplementation(() => {
          throw new Error('Invalid token');
        });

      expect(() => service.checkToken(token)).toThrow(BadRequestException);
    });
  });
});
