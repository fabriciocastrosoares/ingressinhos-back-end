import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call usersService.create', async () => {
    const dto = {
      username: 'Test User',
      email: 'test@example.com',
      password: 'StrongPass123!',
      role: 'CLIENT' as const,
    };

    const createdUser = { id: 1, ...dto };
    usersService.create.mockResolvedValue(createdUser);

    await expect(controller.create(dto)).resolves.toBe(createdUser);

    expect(usersService.create).toHaveBeenCalledWith(dto);
  });
});
