import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'CLIENT',
    createdAt: new Date(),
  };

  const usersService = {
    create: jest.fn(),
    getUserByEmail: jest.fn(),
    isMatchForPassword: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const authRepository = {
    createSession: jest.fn(),
    deleteSession: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: AuthRepository, useValue: authRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should delegate user creation to UsersService', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password',
        username: 'testuser',
        role: 'CLIENT' as const,
      };

      const result = { id: 1, ...dto };
      usersService.create.mockResolvedValue(result);

      await expect(service.signUp(dto)).resolves.toBe(result);
      expect(usersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('signIn', () => {
    const dto = {
      email: 'test@example.com',
      password: 'password',
    };

    it('should throw when user does not exist', async () => {
      usersService.getUserByEmail.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when password does not match', async () => {
      usersService.getUserByEmail.mockResolvedValue(mockUser);
      usersService.isMatchForPassword.mockReturnValue(false);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return token and user and create a session', async () => {
      const token = 'test-token';

      usersService.getUserByEmail.mockResolvedValue(mockUser);
      usersService.isMatchForPassword.mockReturnValue(true);
      jwtService.sign.mockReturnValue(token);
      authRepository.createSession.mockResolvedValue({ id: 1 });

      const result = await service.signIn(dto);

      expect(usersService.getUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(usersService.isMatchForPassword).toHaveBeenCalledWith(
        mockUser,
        dto.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: String(mockUser.id),
      });
      expect(authRepository.createSession).toHaveBeenCalledWith(
        mockUser.id,
        token,
      );

      expect(result).toEqual({
        token,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });
  });

  describe('logout', () => {
    it('should delete the session', async () => {
      authRepository.deleteSession.mockResolvedValue({ count: 1 });

      await expect(service.logout('test-token')).resolves.toEqual({
        message: 'Logout successful',
      });

      expect(authRepository.deleteSession).toHaveBeenCalledWith('test-token');
    });
  });

  describe('createToken', () => {
    it('should create a token with the expected payload', () => {
      jwtService.sign.mockReturnValue('test-token');

      expect(service.createToken(mockUser)).toEqual({
        token: 'test-token',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: String(mockUser.id),
      });
    });
  });

  describe('checkToken', () => {
    it('should verify the token with issuer and audience', () => {
      const decoded = { sub: '1', email: mockUser.email };
      jwtService.verify.mockReturnValue(decoded);

      expect(service.checkToken('test-token')).toBe(decoded);

      expect(jwtService.verify).toHaveBeenCalledWith('test-token', {
        audience: 'users',
        issuer: 'Fabricio',
      });
    });

    it('should throw BadRequestException for an invalid token', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.checkToken('invalid-token')).toThrow(
        BadRequestException,
      );
    });
  });
});
