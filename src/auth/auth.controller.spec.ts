import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { AuthGuard } from '../guards/auth.guards';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should call authService.signUp with correct data and return the result', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password',
        username: 'testuser',
        role: 'CLIENT' as any,
      };

      const result = { id: 1, ...signupDto };

      mockAuthService.signUp.mockResolvedValue(result);

      const response = await controller.signUp(signupDto);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(signupDto);
      expect(response).toBe(result);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with correct data and return the result', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const result = {
        token: 'test-token',
        user: {
          id: 1,
          username: 'testuser',
          email: signInDto.email,
          role: 'CLIENT',
        },
      };

      mockAuthService.signIn.mockResolvedValue(result);

      const response = await controller.signIn(signInDto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(signInDto);
      expect(response).toBe(result);
    });
  });

  describe('logout', () => {
    it('should throw when authorization header is missing', () => {
      expect(() => controller.logout(undefined as unknown as string)).toThrow(
        UnauthorizedException,
      );

      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it('should throw when authorization header is invalid', () => {
      expect(() => controller.logout('Basic test-token')).toThrow(
        UnauthorizedException,
      );

      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it('should call authService.logout with the bearer token', async () => {
      const result = { message: 'Logout successful' };

      mockAuthService.logout.mockResolvedValue(result);

      const response = await controller.logout('Bearer test-token');

      expect(mockAuthService.logout).toHaveBeenCalledWith('test-token');
      expect(response).toBe(result);
    });
  });
});
