# Ingressinho — Backend

API REST desenvolvida com NestJS para gerenciamento de eventos, usuários, ingressos e validação de entrada.

O Ingressinho permite que diferentes perfis de usuários participem de todo o fluxo de um evento:

- Cliente
- Organizador
- Porteiro

O backend é responsável pelas regras de negócio, autenticação, autorização, persistência dos dados, integração com a Ticketmaster Discovery API, compra de ingressos e validação dos QR Codes.

---

## Sobre o projeto

O Ingressinho foi desenvolvido como uma plataforma de gerenciamento de eventos e ingressos.

O sistema permite:

- Criar contas de usuários.
- Autenticar usuários.
- Controlar acesso de acordo com o perfil.
- Consultar eventos.
- Integrar eventos externos da Ticketmaster.
- Cadastrar eventos na plataforma.
- Gerenciar eventos do organizador.
- Reservar ingressos.
- Comprar ingressos.
- Gerar ingressos individuais.
- Compartilhar ingressos através de um `shareToken`.
- Validar ingressos através da portaria.
- Impedir que um ingresso seja utilizado mais de uma vez.
- Registrar o histórico das validações.
- Consultar um ingresso publicamente.

---

# Objetivo

O objetivo do projeto é implementar o fluxo completo de gerenciamento e utilização de ingressos.

O fluxo principal da aplicação pode ser representado da seguinte maneira:

```text
                         Ticketmaster
                              │
                              ▼
                    ┌──────────────────┐
                    │   Organizador    │
                    └────────┬─────────┘
                             │
                       seleciona evento
                             │
                             ▼
                    ┌──────────────────┐
                    │      Evento      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     Cliente      │
                    └────────┬─────────┘
                             │
                       compra ingresso
                             │
                             ▼
                    ┌──────────────────┐
                    │     Ingresso     │
                    │     QR Code      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     Porteiro     │
                    └────────┬─────────┘
                             │
                      valida ingresso
                             │
                             ▼
                    ┌──────────────────┐
                    │ Entrada liberada │
                    └──────────────────┘
```

---

# Tecnologias utilizadas

## Backend

- **Node.js**
- **TypeScript**
- **NestJS**
- **Prisma ORM**
- **PostgreSQL**
- **JWT**
- **bcrypt**
- **class-validator**
- **class-transformer**
- **Axios/fetch para integração externa**
- **CORS**

## Testes

- **Jest**
- **Supertest**
- **NestJS Testing**
- **Testes unitários**
- **Testes E2E**
- **Coverage**

## Integração externa

- **Ticketmaster Discovery API**

---

# Arquitetura

A aplicação segue uma arquitetura modular baseada nos recursos do NestJS.

O fluxo geral é:

```text
                HTTP Request
                     │
                     ▼
              ┌─────────────┐
              │ Controller  │
              └──────┬──────┘
                     │
                     ▼
                ┌─────────┐
                │  Guard  │
                └────┬────┘
                     │
                     ▼
               ┌──────────┐
               │ Service  │
               └────┬─────┘
                    │
                    ▼
             ┌──────────────┐
             │  Repository  │
             └───────┬──────┘
                     │
                     ▼
                 ┌───────┐
                 │Prisma │
                 └───┬───┘
                     │
                     ▼
                PostgreSQL
```

A separação entre Controller, Service e Repository permite manter:

- Controllers responsáveis pelas requisições HTTP.
- Guards responsáveis por autenticação e autorização.
- Services responsáveis pelas regras de negócio.
- Repositories responsáveis pelo acesso aos dados.
- Prisma responsável pela comunicação com o PostgreSQL.

---

# Estrutura do projeto

```text
ingressinho-back-end/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   │
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── signin.dto.ts
│   │   │   └── signup.dto.ts
│   │   │
│   │   ├── auth.controller.ts
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts
│   │   ├── auth.repository.ts
│   │   └── auth.module.ts
│   │
│   ├── users/
│   │   ├── dto/
│   │   │   └── create-user.dto.ts
│   │   ├── users.controller.ts
│   │   ├── users.controller.spec.ts
│   │   ├── users.service.ts
│   │   ├── users.service.spec.ts
│   │   ├── users.repository.ts
│   │   └── users.module.ts
│   │
│   ├── events/
│   │   ├── dto/
│   │   │   ├── create-event.dto.ts
│   │   │   └── reserve.dto.ts
│   │   ├── events.controller.ts
│   │   ├── events.controller.spec.ts
│   │   ├── events.service.ts
│   │   ├── events.service.spec.ts
│   │   ├── events.repository.ts
│   │   └── events.module.ts
│   │
│   ├── tickets/
│   │   ├── dto/
│   │   │   ├── buy-ticket.dto.ts
│   │   │   └── validate-ticket.dto.ts
│   │   ├── tickets.controller.ts
│   │   ├── tickets.controller.spec.ts
│   │   ├── tickets.service.ts
│   │   ├── tickets.service.spec.ts
│   │   ├── tickets.repository.ts
│   │   └── tickets.module.ts
│   │
│   ├── ticketsmaster/
│   │   ├── ticketsmaster.service.ts
│   │   ├── ticketsmaster.service.spec.ts
│   │   └── ticketmaster.module.ts
│   │
│   ├── guards/
│   │   ├── auth.guards.ts
│   │   ├── auth.guards.spec.ts
│   │   ├── roles.guard.ts
│   │   └── roles.guard.spec.ts
│   │
│   ├── crypto/
│   │   ├── bcrypt.service.ts
│   │   ├── bcrypt.service.spec.ts
│   │   └── crypto.module.ts
│   │
│   ├── common/
│   │   └── roles.decorator.ts
│   │
│   ├── decorators/
│   │   └── user.decorator.ts
│   │
│   ├── Prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env.example
├── prisma.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

# Perfis de usuário

O sistema possui três roles:

```text
CLIENT
ORGANIZER
GATEKEEPER
```

## CLIENT

O cliente pode:

- Consultar eventos.
- Reservar ingressos.
- Comprar ingressos.
- Consultar seus ingressos.
- Compartilhar seus ingressos.

## ORGANIZER

O organizador pode:

- Consultar eventos disponíveis.
- Cadastrar eventos.
- Consultar seus próprios eventos.
- Definir capacidade.
- Definir preço dos ingressos.

## GATEKEEPER

O porteiro pode:

- Consultar os eventos cadastrados localmente.
- Validar ingressos.
- Impedir a entrada de ingressos já utilizados.

---

# Autenticação

A autenticação utiliza tokens JWT.

Após o login, o backend retorna:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "Usuario",
    "email": "usuario@email.com",
    "role": "CLIENT"
  }
}
```

Endpoints protegidos utilizam:

```http
Authorization: Bearer <token>
```

---

# Autorização por roles

A aplicação possui dois guards principais:

```text
AuthGuard
RolesGuard
```

O `AuthGuard` verifica a autenticação do usuário.

O `RolesGuard` verifica se o usuário possui a role necessária para executar determinada operação.

As roles são definidas através do decorator:

```typescript
@Roles('CLIENT')
```

ou:

```typescript
@Roles('ORGANIZER')
```

ou:

```typescript
@Roles('GATEKEEPER')
```

---

# Fluxo de autenticação

```text
Cliente
   │
   │ POST /auth/sign-in
   ▼
AuthController
   │
   ▼
AuthService
   │
   ├── busca usuário
   ├── compara senha
   └── cria sessão/token
   │
   ▼
JWT
   │
   ▼
Frontend
```

---

# Logout

O logout utiliza:

```http
POST /auth/logout
```

com:

```http
Authorization: Bearer <token>
```

O backend remove a sessão correspondente ao token.

Isso significa que o token também possui controle através da tabela de sessões no banco.

---

# Senhas

As senhas dos usuários não são armazenadas diretamente.

O projeto utiliza:

```text
bcrypt
```

para realizar o hash das senhas.

O fluxo é:

```text
Senha
  │
  ▼
bcrypt
  │
  ▼
Hash
  │
  ▼
PostgreSQL
```

Durante o login:

```text
Senha informada
      │
      ▼
bcrypt.compare()
      │
      ├── correta ──► login
      │
      └── incorreta ─► 401 Unauthorized
```

---

# Eventos

O módulo de eventos é responsável pelo gerenciamento dos eventos.

Principais funcionalidades:

- Listagem.
- Busca individual.
- Criação.
- Eventos do organizador.
- Eventos da portaria.
- Reserva.
- Integração com Ticketmaster.

---

# Integração com Ticketmaster

O backend possui um `TicketmasterService`.

O serviço consulta a Ticketmaster Discovery API para obter eventos externos.

O organizador pode visualizar esses eventos e escolher quais deseja cadastrar no Ingressinho.

O identificador externo é armazenado no campo:

```text
externalId
```

---

# External ID

O `externalId` relaciona o evento local ao evento externo da Ticketmaster.

Durante a criação:

```text
externalId
    │
    ▼
TicketmasterService
    │
    ▼
Busca evento externo
    │
    ├── encontrado ──► cria evento local
    │
    └── não encontrado ► 404
```

As informações utilizadas para criar o evento incluem:

- Nome.
- Descrição.
- Data.
- Local.
- Capacidade.
- Preço.
- `externalId`.
- Organizador.

---

# Fallback da Ticketmaster

A listagem de eventos possui um mecanismo de fallback.

Fluxo:

```text
GET /events
      │
      ▼
Ticketmaster
      │
      ├── sucesso
      │      │
      │      ▼
      │   Eventos externos
      │      +
      │   Eventos locais
      │
      └── erro
             │
             ▼
        Eventos locais
```

Isso permite que a aplicação continue disponibilizando os eventos locais mesmo quando a API externa estiver indisponível.

---

# Ingressos

O módulo de tickets é responsável por:

- Compra.
- Consulta de ingressos.
- Consulta pública.
- Validação.
- Controle de status.

Cada ingresso possui:

```text
id
code
shareToken
status
eventId
ownerId
reservationId
```

---

# QR Code

O backend gera um `shareToken` único para cada ingresso.

Esse token é utilizado pelo frontend para:

- Gerar o QR Code.
- Criar o link público do ingresso.
- Enviar o ingresso para validação.

O frontend utiliza uma rota pública:

```text
/ticket/:shareToken
```

Essa rota pertence ao frontend.

O frontend consulta o backend através de:

```http
GET /tickets/public/:shareToken
```

Fluxo:

```text
Ingresso
   │
   ▼
shareToken
   │
   ├───────────────┐
   │               │
   ▼               ▼
QR Code       Link público
   │               │
   ▼               ▼
Portaria      Frontend
   │               │
   └───────┬───────┘
           ▼
      Ingressinho API
```

---

# Compra de ingressos

A compra é realizada através de:

```http
POST /tickets/buy
```

Somente usuários `CLIENT` podem executar essa operação.

O payload possui:

```json
{
  "eventId": 1,
  "quantity": 2
}
```

O fluxo implementado é:

```text
Cliente
   │
   ▼
POST /tickets/buy
   │
   ▼
Busca evento
   │
   ▼
Atualiza soldCount
   │
   ▼
Cria Reservation
   │
   ▼
Cria Payment
   │
   ▼
Cria Ticket(s)
   │
   ▼
Retorna reserva e ingressos
```

---

# Pagamento

O banco possui uma entidade `Payment`.

Durante a compra, o backend registra o pagamento como:

```text
APPROVED
```

O projeto atualmente representa o pagamento aprovado dentro do próprio fluxo da aplicação.

Não existe, no código atual, integração com um gateway externo de pagamentos.

Uma integração real com serviços como gateways de cartão, Pix ou outros meios de pagamento pode ser adicionada futuramente.

---

# Reservation

Cada compra gera uma reserva.

A reserva possui:

```text
userId
eventId
quantity
status
```

O status atualmente pode ser:

```text
CONFIRMED
CANCELLED
```

---

# Status do ingresso

Os ingressos possuem três estados:

```text
VALID
USED
CANCELLED
```

Um ingresso recém-criado começa como:

```text
VALID
```

Após ser validado na portaria:

```text
VALID
  │
  ▼
USED
```

---

# Validação na portaria

A validação é realizada através de:

```http
POST /tickets/validate
```

Somente usuários `GATEKEEPER` podem executar essa operação.

O DTO recebe:

```json
{
  "shareToken": "token-do-ingresso"
}
```

O fluxo é:

```text
QR Code
   │
   ▼
shareToken
   │
   ▼
POST /tickets/validate
   │
   ▼
Busca ingresso
   │
   ├── não encontrado ──► erro
   │
   ▼
Verifica status
   │
   ├── USED/CANCELLED ──► ingresso recusado
   │
   ▼
Atualiza para USED
   │
   ▼
Cria TicketValidation
   │
   ▼
Ingresso validado
```

---

# Prevenção de reutilização

Um dos principais requisitos do sistema é impedir que o mesmo ingresso seja utilizado duas vezes.

A validação verifica se o ingresso ainda possui status:

```text
VALID
```

Depois da validação:

```text
VALID → USED
```

Uma nova tentativa encontra:

```text
USED
```

e é recusada.

Isso evita que um mesmo QR Code seja apresentado novamente para liberar outra entrada.

---

# Histórico de validações

Cada validação bem-sucedida gera um registro na tabela:

```text
TicketValidation
```

O registro contém:

```text
ticketId
gatekeeperId
result
createdAt
```

Isso permite manter um histórico de quem validou determinado ingresso e quando a validação ocorreu.

---

# Banco de dados

O projeto utiliza:

```text
PostgreSQL
```

com:

```text
Prisma ORM
```

O schema possui as seguintes entidades principais:

```text
User
   │
   ├── Session
   ├── Event
   ├── Reservation
   ├── Ticket
   └── TicketValidation

Event
   │
   ├── Reservation
   └── Ticket

Reservation
   │
   ├── Payment
   └── Ticket

Ticket
   │
   └── TicketValidation
```

---

# Modelos do Prisma

## User

Representa os usuários da plataforma.

Principais campos:

```text
id
username
email
password
role
createdAt
```

---

## Session

Representa as sessões autenticadas.

```text
id
userId
token
createdAt
```

O token é único.

---

## Event

Representa os eventos cadastrados.

```text
id
title
description
date
location
capacity
soldCount
price
externalId
organizerId
createdAt
```

---

## Reservation

Representa uma reserva/compra.

```text
id
userId
eventId
quantity
status
createdAt
```

---

## Payment

Representa o pagamento associado à reserva.

```text
id
reservationId
status
amount
createdAt
```

---

## Ticket

Representa um ingresso individual.

```text
id
reservationId
eventId
ownerId
code
shareToken
status
createdAt
```

O `shareToken` é único e utilizado no fluxo de QR Code e compartilhamento.

---

## TicketValidation

Registra a validação de um ingresso.

```text
id
ticketId
gatekeeperId
result
createdAt
```

---

# Transações

O módulo de eventos utiliza transações do Prisma em operações que alteram múltiplos dados.

Exemplo:

```typescript
this.prisma.$transaction(async (tx) => {
  // operações relacionadas à reserva
});
```

Isso ajuda a manter a consistência das operações de reserva.

---

# Repository Pattern

O projeto utiliza repositories para separar acesso ao banco das regras de negócio.

Exemplo:

```text
EventsService
      │
      ▼
EventsRepository
      │
      ▼
PrismaService
      │
      ▼
PostgreSQL
```

O mesmo padrão é utilizado no módulo de tickets e demais recursos que possuem persistência.

---

# DTOs

Os DTOs definem os dados esperados pela API e são utilizados em conjunto com:

```text
class-validator
class-transformer
```

Principais DTOs:

```text
CreateUserDto
SignupDto
SigninDto
CreateEventDto
ReserveDto
BuyTicketDto
ValidateTicketDto
```

A aplicação utiliza validação global para impedir dados inválidos ou campos não permitidos.

---

# ValidationPipe

A aplicação utiliza:

```typescript
ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});
```

Isso permite:

- Validar os DTOs.
- Remover propriedades não esperadas.
- Transformar tipos quando necessário.
- Rejeitar propriedades não permitidas.

---

# CORS

O backend está configurado para aceitar requisições do frontend em desenvolvimento:

```text
http://localhost:5173
```

Também são permitidos os principais métodos HTTP utilizados pela aplicação.

O header:

```text
Authorization
```

é permitido para autenticação através do JWT.

---

# Principais endpoints

## Auth

### Cadastro

```http
POST /auth/sign-up
```

### Login

```http
POST /auth/sign-in
```

### Logout

```http
POST /auth/logout
```

---

# Usuários

### Criar usuário

```http
POST /users
```

---

# Eventos

### Listar eventos

```http
GET /events
```

### Buscar evento

```http
GET /events/:id
```

### Eventos do organizador

```http
GET /events/my
```

### Eventos da portaria

```http
GET /events/gatekeeper
```

### Criar evento

```http
POST /events
```

### Reservar ingressos

```http
POST /events/:id/reserve
```

---

# Tickets

### Comprar ingresso

```http
POST /tickets/buy
```

### Listar meus ingressos

```http
GET /tickets/my
```

### Buscar ingresso autenticado

```http
GET /tickets/:code
```

### Consultar ingresso publicamente

```http
GET /tickets/public/:shareToken
```

### Validar ingresso

```http
POST /tickets/validate
```

---

# ⚙️ Pré-requisitos

Para executar o projeto localmente, é necessário ter instalado:

- Node.js
- npm
- PostgreSQL
- Git

Também é necessário possuir uma chave da Ticketmaster Discovery API para utilizar a integração de eventos externos.

---

# Instalação

Clone o projeto e entre na pasta:

```bash
cd ingressinho-back-end
```

Instale as dependências:

```bash
npm install
```

---

# Variáveis de ambiente

Crie um arquivo:

```text
.env
```

com as variáveis necessárias.

Exemplo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME"
JWT_SECRET="your-jwt-secret"
TICKETMASTER_API_KEY="your-api-key-ticketmaster"
```

### DATABASE_URL

Define a conexão com o PostgreSQL.

### JWT_SECRET

Chave utilizada para assinatura dos tokens JWT.

### TICKETMASTER_API_KEY

Chave utilizada para comunicação com a Ticketmaster Discovery API.

---

# Banco de dados

Depois de configurar o PostgreSQL e o `.env`, execute as migrations do Prisma:

```bash
npx prisma migrate dev
```

Depois gere o Prisma Client:

```bash
npx prisma generate
```

Depois rode o seed para popular o banco de dados para testar

````bash
npx prisma seed


---

# Executando o projeto

## Desenvolvimento

```bash
npm run start:dev
````

O backend será executado na porta:

```text
3000
```

---

## Desenvolvimento sem watch

```bash
npm run start
```

---

## Produção

Primeiro faça o build:

```bash
npm run build
```

Depois:

```bash
npm run start:prod
```

---

# Testes

O projeto possui testes unitários e testes E2E.

A suíte de testes cobre principalmente:

- Auth.
- Users.
- Events.
- Tickets.
- Guards.
- Roles.
- bcrypt.
- Ticketmaster.
- Fluxos completos da aplicação.

---

# Testes unitários

Para executar os testes:

```bash
npm test
```

Para executar observando alterações:

```bash
npm run test:watch
```

---

# Coverage

Para gerar o relatório de cobertura:

```bash
npm run test:cov
```

A cobertura considera:

```text
Statements
Branches
Functions
Lines
```

---

# Testes E2E

Os testes E2E utilizam:

```text
Jest
Supertest
NestJS Testing
PostgreSQL
Prisma
```

A aplicação real do NestJS é inicializada durante os testes.

A integração com a Ticketmaster é substituída por um mock para manter os testes determinísticos e independentes da disponibilidade da API externa.

Para executar:

```bash
npm run test:e2e
```

O projeto possui configuração específica para o ambiente de testes:

```text
.env.test
```

---

# O que os testes E2E cobrem

A suíte E2E cobre o fluxo principal da aplicação, incluindo:

### Health check

```text
GET /health
```

### Autenticação

- Cadastro.
- Login.
- Senha incorreta.
- Logout.
- Validação de dados.

### Autorização

- Acesso sem token.
- Restrição de CLIENT.
- Restrição de ORGANIZER.
- Restrição de GATEKEEPER.

### Eventos

- Criação.
- Eventos do organizador.
- Eventos da portaria.
- Busca de evento.
- Reserva.
- Controle de capacidade.

### Ingressos

- Compra.
- Listagem dos ingressos do cliente.
- Geração de tickets.
- Consulta pública.
- Validação.
- Reutilização de ingresso.
- Tentativa de validação em evento incorreto.

---

# Resultado dos testes

A suíte atual possui:

```text
12 suítes de teste
83 testes
```

Todos os testes estão passando atualmente.

A última execução apresentou:

```text
Test Suites: 12 passed, 12 total
Tests:       83 passed, 83 total
```

A cobertura atual registrada no projeto está aproximadamente em:

```text
Statements: 70%
Branches:   72%
Functions:  59%
Lines:      70%
```

O foco da suíte está principalmente nas regras de negócio e nos fluxos críticos da aplicação.

---

# Qualidade de código

O projeto utiliza:

- ESLint
- Prettier
- TypeScript
- Testes automatizados

Para executar o lint:

```bash
npm run lint
```

Para formatar o código:

```bash
npm run format
```

---

# Fluxo completo da aplicação

O fluxo principal pode ser resumido assim:

```text
                    ┌──────────────┐
                    │  Ticketmaster│
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Organizador  │
                    └──────┬───────┘
                           │
                    cria evento local
                           │
                           ▼
                    ┌──────────────┐
                    │    Evento    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Cliente   │
                    └──────┬───────┘
                           │
                      compra ingresso
                           │
                           ▼
                    ┌──────────────┐
                    │  Reservation │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Payment    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Ticket    │
                    └──────┬───────┘
                           │
                     gera shareToken
                           │
                           ▼
                    ┌──────────────┐
                    │   QR Code    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Porteiro    │
                    └──────┬───────┘
                           │
                    valida shareToken
                           │
                           ▼
                    ┌──────────────┐
                    │ Ticket USED  │
                    └──────────────┘
```

---

# Segurança

O projeto possui algumas medidas de segurança importantes:

- Senhas armazenadas utilizando bcrypt.
- Autenticação baseada em JWT.
- Sessões armazenadas no banco.
- Guards para endpoints protegidos.
- Controle de acesso por role.
- Validação dos dados recebidos.
- Bloqueio de propriedades não previstas nos DTOs.
- `shareToken` único por ingresso.
- Bloqueio de reutilização de ingressos.

---

# Considerações atuais

O projeto possui algumas implementações que representam decisões simplificadas para o escopo da aplicação.

### Pagamento

Atualmente o pagamento é registrado diretamente como:

```text
APPROVED
```

Não existe integração com um gateway financeiro real.

### Ticketmaster

A Ticketmaster é utilizada como fonte externa de eventos.

Durante os testes automatizados, sua integração é mockada.

### Frontend

O frontend é responsável pela geração visual do QR Code.

O backend fornece o `shareToken` utilizado como conteúdo do QR Code.

### CORS

A configuração atual está direcionada ao ambiente local:

```text
http://localhost:5173
```

Em produção, essa origem deve ser configurada de acordo com o domínio real do frontend.

---

# Possíveis evoluções

Algumas funcionalidades podem ser adicionadas futuramente:

- Integração com gateway de pagamento.
- Cancelamento de ingressos.
- Reembolso.
- Atualização de eventos.
- Dashboard para organizadores.
- Relatórios de vendas.
- Histórico detalhado de validações.
- Controle de múltiplas portarias por evento.
- Expiração automática de ingressos.
- Rate limiting.
- Refresh token.
- Documentação OpenAPI/Swagger.
- Deploy automatizado.
- Observabilidade e logs estruturados.

---

# Organização das responsabilidades

| Camada              | Responsabilidade            |
| ------------------- | --------------------------- |
| Controller          | Receber requisições HTTP    |
| Guard               | Autenticação e autorização  |
| DTO                 | Validar dados de entrada    |
| Service             | Regras de negócio           |
| Repository          | Acesso ao banco             |
| Prisma              | ORM e persistência          |
| TicketmasterService | Integração externa          |
| CryptoService       | Hash e verificação de senha |

---

# Principais regras de negócio

## Usuários

- O email deve ser único.
- Usuários possuem uma role.
- Senhas são armazenadas utilizando hash.

## Eventos

- Eventos possuem capacidade.
- Eventos possuem quantidade de ingressos vendidos.
- Eventos podem estar relacionados a um evento externo da Ticketmaster.
- Apenas organizadores podem criar eventos.
- Organizadores visualizam seus próprios eventos.

## Reservas

- Apenas clientes podem reservar.
- A quantidade não pode ultrapassar a capacidade disponível.
- O `soldCount` é atualizado durante a operação.

## Ingressos

- Cada ingresso pertence a um usuário.
- Cada ingresso pertence a um evento.
- Cada ingresso possui um `shareToken` único.
- O ingresso começa como `VALID`.

## Validação

- Apenas porteiros podem validar.
- O ingresso precisa existir.
- O ingresso precisa estar `VALID`.
- Após a validação, o ingresso passa para `USED`.
- Um ingresso `USED` não pode ser utilizado novamente.
- A validação é registrada no histórico.

---

# Conclusão

O Ingressinho Backend implementa uma API modular para gerenciamento de eventos e ingressos, contemplando autenticação, autorização por perfil, integração com eventos externos, compra de ingressos, geração de tokens de compartilhamento e validação de entrada.

A arquitetura foi organizada para separar responsabilidades entre:

```text
Controllers
     ↓
Guards
     ↓
Services
     ↓
Repositories
     ↓
Prisma
     ↓
PostgreSQL
```

O projeto também conta com uma suíte de testes automatizados cobrindo tanto unidades isoladas quanto fluxos completos através de testes E2E.

O fluxo central da aplicação é:

```text
Ticketmaster
     ↓
Organizador
     ↓
Evento
     ↓
Cliente
     ↓
Compra
     ↓
Ingresso
     ↓
QR Code
     ↓
Porteiro
     ↓
Validação
     ↓
Entrada autorizada
```

**Ingressinho — do evento à entrada.**
