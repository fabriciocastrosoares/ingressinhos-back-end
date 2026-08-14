import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { HttpStatus } from '@nestjs/common';
import { Role } from '@prisma/client';

enum Role {
  ORGANIZER = 'ORGANIZER',
  CLIENT = 'CLIENT',
  GATEKEEPER = 'GATEKEEPER',
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
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
        role: Role.CLIENT,
      };
      const result = { id: 1, ...signupDto };
      mockAuthService.signUp.mockResolvedValue(result);

      const response = await controller.signUp(signupDto);

      expect(authService.signUp).toHaveBeenCalledWith(signupDto);
      expect(response).toBe(result);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with correct data and return a token', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const result = { token: 'test-token' };
      mockAuthService.signIn.mockResolvedValue(result);

      const response = await controller.signIn(signInDto);

      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(response).toBe(result);
    });
  });
});
