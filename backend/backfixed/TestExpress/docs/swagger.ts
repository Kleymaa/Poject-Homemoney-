const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'HomeBudget API',
    version: '1.0.0',
    description: 'Backend API for HomeBudget project',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterDto: {
        type: 'object',
        required: ['login', 'email', 'password', 'confirmPassword'],
        properties: {
          login: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          confirmPassword: { type: 'string' },
        },
      },
      LoginDto: {
        type: 'object',
        required: ['login', 'password'],
        properties: {
          login: { type: 'string' },
          password: { type: 'string' },
        },
      },
      AccountDto: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          balance: { type: 'number' },
          currency: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Регистрация пользователя',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterDto' },
            },
          },
        },
        responses: {
          201: { description: 'Пользователь зарегистрирован' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Вход пользователя',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginDto' },
            },
          },
        },
        responses: {
          200: { description: 'Успешный вход' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/accounts': {
      get: {
        summary: 'Получить счета',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Создать счет',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AccountDto' },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/categories': {
      get: {
        summary: 'Получить категории',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Создать категорию',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/transactions': {
      get: {
        summary: 'Получить операции',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Создать операцию',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/families': {
      post: {
        summary: 'Создать семью',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/loans': {
      get: {
        summary: 'Получить кредиты',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Создать кредит',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/analytics/summary': {
      get: {
        summary: 'Сводная аналитика',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/reports/operations/export': {
      get: {
        summary: 'Экспорт отчета',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'File generated' } },
      },
    },
    '/notifications': {
      get: {
        summary: 'Получить уведомления',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/action-logs': {
      get: {
        summary: 'Получить логи действий',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
  },
};

export default swaggerSpec;