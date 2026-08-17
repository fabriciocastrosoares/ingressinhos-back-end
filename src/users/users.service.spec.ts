import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { BcryptService } from '../crypto/bcrypt.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    create: jest.Mock;
    getUserByEmail: jest.Mock;
    getUserById: jest.Mock;
  };
  let bcrypt: {
    hash: jest.Mock;
    isMatch: jest.Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      create: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
    };

    bcrypt = {
      hash: jest.fn(),
      isMatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: BcryptService, useValue: bcrypt },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      username: 'Test User',
      email: 'test@example.com',
      password: 'StrongPass123!',
      role: 'CLIENT' as const,
    };

    it('should create a user with the hashed password', async () => {
      usersRepository.getUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockReturnValue('hashed-password');

      const createdUser = {
        id: 1,
        ...dto,
        password: 'hashed-password',
      };

      usersRepository.create.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(usersRepository.getUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password);
      expect(usersRepository.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashed-password',
      });
      expect(result).toBe(createdUser);
    });

    it('should throw ConflictException when email is already in use', async () => {
      usersRepository.getUserByEmail.mockResolvedValue({ id: 1 });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    it('should return the user', async () => {
      const user = { id: 1, email: 'test@example.com' };
      usersRepository.getUserByEmail.mockResolvedValue(user);

      await expect(service.getUserByEmail(user.email)).resolves.toBe(user);
    });
  });

  describe('isMatchForPassword', () => {
    it('should delegate password comparison to bcrypt', () => {
      const user = { id: 1, password: 'hashed-password' };
      bcrypt.isMatch.mockReturnValue(true);

      expect(service.isMatchForPassword(user, 'password')).toBe(true);
      expect(bcrypt.isMatch).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      );
    });
  });

  describe('getUserById', () => {
    it('should return the user', async () => {
      const user = { id: 1, username: 'Test User' };
      usersRepository.getUserById.mockResolvedValue(user);

      await expect(service.getUserById(1)).resolves.toBe(user);
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      usersRepository.getUserById.mockResolvedValue(null);

      await expect(service.getUserById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
