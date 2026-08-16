# Ingressinho — Backend

<p align="center">
  <strong>API REST responsável pelo gerenciamento de usuários, eventos, reservas, ingressos e validação de entradas.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-Backend-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-Language-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Authentication-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Ticketmaster-Integration-026CDF?style=for-the-badge" />
</p>

---

## Sobre o projeto

O **Ingressinho** é uma aplicação full stack para gerenciamento de eventos e ingressos.

Este repositório contém o **backend**, desenvolvido com NestJS, responsável por disponibilizar a API REST utilizada pelo frontend.

A API controla o fluxo completo da aplicação:

```text
Usuário
   │
   ▼
Autenticação
   │
   ▼
Perfil de acesso
   │
   ├───────────────┬────────────────┐
   ▼               ▼                ▼
CLIENT         ORGANIZER       GATEKEEPER
   │               │                │
   ▼               ▼                ▼
Comprar        Criar eventos     Validar
ingressos      e acompanhar      ingressos
   │            vendas              │
   ▼               │                ▼
Ingressos         │             QR Code
   │               │                │
   └───────────────┴────────────────┘
                   │
                   ▼
               PostgreSQL
```

---

# Objetivo

O backend foi desenvolvido para centralizar as regras de negócio do Ingressinho.

Entre suas responsabilidades estão:

- Cadastro e autenticação de usuários.
- Controle de acesso por perfil.
- Integração com a Ticketmaster Discovery API.
- Cadastro de eventos.
- Controle de capacidade.
- Controle de ingressos vendidos.
- Reservas.
- Pagamentos.
- Geração de ingressos.
- Geração de identificadores para compartilhamento.
- Consulta dos ingressos do cliente.
- Validação de ingressos na portaria.
- Registro das validações realizadas.

---

# Perfis de usuário

A aplicação trabalha com três papéis principais:

```text
CLIENT
ORGANIZER
GATEKEEPER
```

## CLIENT

O cliente pode:

- Consultar eventos.
- Comprar ingressos.
- Consultar seus próprios ingressos.
- Compartilhar ingressos.
- Apresentar o QR Code na entrada.

As operações protegidas do cliente utilizam:

```typescript
@Roles('CLIENT')
```

---

## ORGANIZER

O organizador pode:

- Consultar eventos disponíveis.
- Escolher eventos da Ticketmaster.
- Criar eventos no Ingressinho.
- Definir capacidade.
- Definir preço.
- Consultar seus próprios eventos.

As operações protegidas do organizador utilizam:

```typescript
@Roles('ORGANIZER')
```

---

## GATEKEEPER

O porteiro é responsável pela entrada do evento.

Pode:

- Consultar eventos disponíveis para a portaria.
- Selecionar eventos.
- Validar ingressos.
- Registrar a validação.

As operações protegidas utilizam:

```typescript
@Roles('GATEKEEPER')
```

---

# Autenticação e autorização

A API utiliza autenticação baseada em token.

As rotas protegidas utilizam:

```typescript
@UseGuards(AuthGuard, RolesGuard)
```

O `AuthGuard` verifica a autenticação do usuário.

O `RolesGuard` verifica se o usuário possui o papel necessário.

Exemplo:

```typescript
@Post('buy')
@UseGuards(AuthGuard, RolesGuard)
@Roles('CLIENT')
buy(@Req() request: any, @Body() dto: BuyTicketDto) {
  return this.service.buy(request.user.id, dto);
}
```

Nesse fluxo:

```text
Request
   │
   ▼
AuthGuard
   │
   ▼
Usuário autenticado?
   │
   ▼
RolesGuard
   │
   ▼
Possui CLIENT?
   │
   ▼
Controller
   │
   ▼
Service
```

---

# Guards e Roles

O projeto utiliza uma estrutura baseada em guards.

Principais elementos:

```text
guards/
├── auth.guards.ts
└── roles.guard.ts
```

E o decorator:

```text
common/
└── roles.decorator.ts
```

Exemplo:

```typescript
@UseGuards(AuthGuard, RolesGuard)
@Roles('GATEKEEPER')
```

Isso evita que um cliente execute operações exclusivas da portaria.

---

# Módulo de ingressos

O módulo de tickets concentra a lógica relacionada aos ingressos.

Estrutura:

```text
tickets/
├── tickets.controller.ts
├── tickets.service.ts
├── tickets.repository.ts
└── dto/
    ├── buy-ticket.dto.ts
    └── validate-ticket.dto.ts
```

---

## 🛒 Compra de ingresso

A compra é realizada através de:

```http
POST /tickets/buy
```

Somente usuários `CLIENT` podem utilizar essa operação.

O controller recebe:

```typescript
{
  (eventId, quantity);
}
```

O service executa o fluxo:

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
Verifica existência
   │
   ▼
Atualiza ingressos vendidos
   │
   ▼
Cria reserva
   │
   ▼
Cria pagamento
   │
   ▼
Cria ingressos
   │
   ▼
Retorna reserva
```

Para cada unidade comprada, um ticket é criado.

O código do ticket é gerado através de:

```typescript
randomUUID();
```

---

# Ticket

Cada ingresso possui informações relacionadas a:

- Reserva.
- Evento.
- Proprietário.
- Código.
- `shareToken`.
- Status.
- Data de criação.

O status utilizado na validação inclui:

```text
VALID
USED
```

O ingresso começa válido e, quando utilizado, passa para:

```text
USED
```

---

# 🔗 Share Token

O `shareToken` é utilizado para identificar o ingresso no fluxo de compartilhamento e validação.

O frontend utiliza esse valor para:

- Gerar o QR Code.
- Criar o link público do ingresso.
- Enviar o ingresso para validação.

Exemplo de rota pública utilizada pelo frontend:

```text
/ticket/:shareToken
```

---

# Validação do ingresso

A portaria utiliza:

```http
POST /tickets/validate
```

Apenas usuários `GATEKEEPER` podem executar essa operação.

O DTO recebe:

```typescript
{
  shareToken;
}
```

O service:

1. Procura o ingresso pelo `shareToken`.
2. Verifica se o ingresso existe.
3. Verifica o status.
4. Impede a reutilização de ingressos.
5. Atualiza o status para `USED`.
6. Cria um registro de validação.
7. Retorna os dados necessários para a portaria.

Fluxo:

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
Status = VALID?
   │
   ├── não ─────────────► ingresso já utilizado
   │
   ▼
Status = USED
   │
   ▼
Cria TicketValidation
   │
   ▼
Ingresso validado
```

---

# Prevenção de reutilização

Um dos pontos importantes do sistema é impedir que o mesmo ingresso seja utilizado duas vezes.

A validação verifica:

```typescript
if (ticket.status !== TicketStatus.VALID) {
  throw new BadRequestException('Ticket already used');
}
```

Quando a validação é aprovada:

```typescript
await this.repository.updateTicketStatus(ticket.id, TicketStatus.USED);
```

Assim, uma segunda tentativa de entrada é recusada.

---

# Registro de validações

Após uma validação bem-sucedida, o sistema registra:

```typescript
await this.repository.createValidation({
  ticketId: ticket.id,
  gatekeeperId,
  result: 'VALID',
});
```

Isso permite manter o histórico de validações dos ingressos.

---

# Módulo de eventos

O módulo de eventos é responsável por:

- Listagem de eventos.
- Consulta individual.
- Integração com Ticketmaster.
- Criação de eventos.
- Eventos do organizador.
- Eventos disponíveis para a portaria.
- Reservas.

Estrutura:

```text
events/
├── events.controller.ts
├── events.service.ts
├── events.repository.ts
└── dto/
    ├── create-event.dto.ts
    └── reserve.dto.ts
```

---

# Eventos da Ticketmaster

O projeto possui integração com a **Ticketmaster Discovery API**.

O backend utiliza:

```text
TicketmasterService
```

para buscar eventos externos.

O organizador pode escolher um evento da Ticketmaster e cadastrá-lo localmente.

---

# External ID

Os eventos externos possuem um identificador:

```text
externalId
```

Esse valor permite relacionar o evento do Ingressinho ao evento existente na Ticketmaster.

Durante a criação:

```typescript
const ticketmasterEvent = await this.ticketmaster.findEventByExternalId(
  dto.externalId,
);
```

O backend consulta a Ticketmaster antes de criar o evento local.

Se o evento não for encontrado:

```text
404 Event not found
```

---

# Criação de eventos

A criação é realizada por:

```http
POST /events
```

Somente organizadores podem executar essa operação.

O DTO informa:

```typescript
{
  (externalId, capacity, price);
}
```

O backend busca as informações do evento na Ticketmaster e monta o registro local.

Informações utilizadas incluem:

- Nome.
- Descrição.
- Data.
- Local.
- Capacidade.
- Preço.
- `externalId`.
- Organizador.

---

# Listagem de eventos

A rota:

```http
GET /events
```

busca eventos disponíveis.

O service tenta consultar a Ticketmaster.

Caso a consulta externa falhe, existe fallback para os eventos armazenados localmente.

Fluxo:

```text
GET /events
      │
      ▼
Ticketmaster
      │
      ├── sucesso ──► merge com eventos locais
      │
      └── erro ─────► eventos locais
```

---

# Eventos da portaria

A portaria utiliza:

```http
GET /events/gatekeeper
```

Essa rota exige:

```text
GATEKEEPER
```

O backend retorna os eventos armazenados localmente.

Isso é importante porque somente eventos cadastrados no Ingressinho podem possuir ingressos locais para validação.

---

# Eventos do organizador

O organizador utiliza:

```http
GET /events/my
```

A API identifica o usuário através do token:

```typescript
request.user.id;
```

e retorna somente os eventos pertencentes àquele organizador.

---

# Reservas e pagamentos

O projeto possui entidades relacionadas a:

```text
Reservation
Payment
Ticket
Event
```

Durante uma compra, o fluxo implementado no módulo de tickets cria:

```text
Reservation
     │
     ▼
Payment
     │
     ▼
Tickets
```

O pagamento é registrado com:

```text
PaymentStatus.APPROVED
```

A implementação atual representa o pagamento aprovado dentro do fluxo da aplicação.

Uma integração com um gateway de pagamento real pode ser adicionada futuramente.

---

# Transações

O módulo de eventos utiliza transações do Prisma para operações de reserva.

Exemplo:

```typescript
return this.prisma.$transaction(async (tx) => {
  ...
});
```

Dentro da transação são realizados os passos relacionados à reserva.

Isso ajuda a manter a consistência dos dados durante operações que alteram mais de uma informação.

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

O Prisma é responsável pelo acesso ao banco e pelas operações de persistência.

A aplicação utiliza um `PrismaService` centralizado.

Estrutura:

```text
src/
└── Prisma/
    └── prisma.service.ts
```

---

# Prisma

O projeto possui o schema do Prisma e um cliente gerado.

A estrutura utilizada inclui modelos relacionados ao fluxo principal:

```text
User
Event
Reservation
Payment
Ticket
TicketValidation
```

O cliente Prisma é utilizado pelos repositories.

Exemplo:

```typescript
this.prisma.event.findUnique({
  where: { id },
});
```

---

# Repository Pattern

A aplicação separa as regras de negócio do acesso ao banco.

Exemplo:

```text
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
Prisma
    │
    ▼
PostgreSQL
```

Isso é aplicado, por exemplo, em:

```text
EventsRepository
TicketsRepository
```

O repository concentra operações como:

- Buscar eventos.
- Criar eventos.
- Atualizar quantidade vendida.
- Criar reservas.
- Criar pagamentos.
- Criar ingressos.
- Buscar tickets.
- Atualizar status.
- Criar validações.

---

# DTOs

Os DTOs são utilizados para validar e organizar os dados recebidos pela API.

Exemplos:

```text
CreateEventDto
ReserveDto
BuyTicketDto
ValidateTicketDto
```

Eles ajudam a manter contratos claros entre frontend e backend.

---

# Principais endpoints

## Eventos

### Listar eventos

```http
GET /events
```

### Listar eventos do organizador

```http
GET /events/my
```

### Listar eventos da portaria

```http
GET /events/gatekeeper
```

### Buscar evento

```http
GET /events/:id
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

## Ingressos

### Comprar ingresso

```http
POST /tickets/buy
```

### Meus ingressos

```http
GET /tickets/my
```

### Buscar ingresso por código

```http
GET /tickets/:code
```

### Validar ingresso

```http
POST /tickets/validate
```

---

# Matriz de acesso

| Endpoint                   |   CLIENT    |  ORGANIZER  | GATEKEEPER  |
| -------------------------- | :---------: | :---------: | :---------: |
| `GET /events`              |     ✅      |     ✅      |     ✅      |
| `GET /events/my`           |     ❌      |     ✅      |     ❌      |
| `GET /events/gatekeeper`   |     ❌      |     ❌      |     ✅      |
| `GET /events/:id`          |   Público   |   Público   |   Público   |
| `POST /events`             |     ❌      |     ✅      |     ❌      |
| `POST /events/:id/reserve` |     ✅      |     ❌      |     ❌      |
| `POST /tickets/buy`        |     ✅      |     ❌      |     ❌      |
| `GET /tickets/my`          |     ✅      |     ❌      |     ❌      |
| `GET /tickets/:code`       | Autenticado | Autenticado | Autenticado |
| `POST /tickets/validate`   |     ❌      |     ❌      |     ✅      |

---

# Estrutura do backend

A estrutura geral do projeto segue uma organização modular do NestJS:

```text
src/
│
├── auth/
│
├── users/
│
├── events/
│   ├── dto/
│   │   ├── create-event.dto.ts
│   │   └── reserve.dto.ts
│   ├── events.controller.ts
│   ├── events.service.ts
│   └── events.repository.ts
│
├── tickets/
│   ├── dto/
│   │   ├── buy-ticket.dto.ts
│   │   └── validate-ticket.dto.ts
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   └── tickets.repository.ts
│
├── ticketsmaster/
│   └── ticketsmaster.service.ts
│
├── guards/
│   ├── auth.guards.ts
│   └── roles.guard.ts
│
├── common/
│   └── roles.decorator.ts
│
├── Prisma/
│   └── prisma.service.ts
│
└── main.ts
```

A estrutura pode variar conforme a organização final do repositório.

---

# Arquitetura da aplicação

```text
                  ┌────────────────────┐
                  │      Frontend      │
                  │   React + Vite     │
                  └─────────┬──────────┘
                            │
                         HTTP/JSON
                            │
                            ▼
                  ┌────────────────────┐
                  │      NestJS        │
                  │       API         │
                  └─────────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        Controllers      Guards         Services
                            │              │
                            │              ▼
                            │         Repositories
                            │              │
                            │              ▼
                            │           Prisma
                            │              │
                            │              ▼
                            │         PostgreSQL
                            │
                            ▼
                       Autorização

                  ┌────────────────────┐
                  │    Ticketmaster    │
                  │   Discovery API    │
                  └────────────────────┘
```

---

# Tecnologias utilizadas

## Backend

- NestJS
- Node.js
- TypeScript

## Banco de dados

- PostgreSQL
- Prisma ORM

## Segurança

- JWT
- Guards do NestJS
- Controle de acesso por roles

## Integrações

- Ticketmaster Discovery API

## Outros recursos

- UUID para códigos de ingressos.
- DTOs.
- Repository Pattern.
- Transações Prisma.

---

# Como executar

## 1. Clone o repositório

```bash
git clone URL_DO_REPOSITORIO
cd nome-do-projeto
```

## 2. Instale as dependências

```bash
npm install
```

## 3. Configure o banco de dados

Crie um banco PostgreSQL e configure a conexão através da variável de ambiente utilizada pelo projeto.

Exemplo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ingressinho"
```

> Utilize os nomes das variáveis definidos no seu `.env` e na configuração do Prisma caso sejam diferentes.

---

# Variáveis de ambiente

As principais configurações esperadas pelo backend incluem:

```env
DATABASE_URL=
JWT_SECRET=
TICKETMASTER_API_KEY=
```

Exemplo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ingressinho"
JWT_SECRET="sua-chave-secreta"
TICKETMASTER_API_KEY="sua-chave-da-ticketmaster"
```

Nunca publique valores reais de secrets, tokens ou chaves de API no repositório.

---

# Prisma

Depois de configurar o banco, gere o Prisma Client:

```bash
npx prisma generate
```

Para aplicar migrations em ambiente de desenvolvimento:

```bash
npx prisma migrate dev
```

Para consultar o banco através do Prisma Studio:

```bash
npx prisma studio
```

Em ambiente de produção, utilize o fluxo de migrations apropriado ao projeto, por exemplo:

```bash
npx prisma migrate deploy
```

---

# ▶ Executando o servidor

Modo desenvolvimento:

```bash
npm run start:dev
```

Modo normal:

```bash
npm run start
```

Build:

```bash
npm run build
```

Execução do build:

```bash
npm run start:prod
```

Os scripts disponíveis podem ser conferidos no `package.json`.

---

# Fluxo completo da aplicação

```text
                    ┌──────────────┐
                    │ Ticketmaster │
                    └──────┬───────┘
                           │
                      eventos
                           │
                           ▼
                    ┌──────────────┐
                    │ Organizador  │
                    └──────┬───────┘
                           │
                     cria evento
                           │
                           ▼
                    ┌──────────────┐
                    │   PostgreSQL │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Cliente   │
                    └──────┬───────┘
                           │
                       compra
                           │
                           ▼
                    ┌──────────────┐
                    │   Reserva    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Pagamento  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Ingresso   │
                    └──────┬───────┘
                           │
                       QR Code
                           │
                           ▼
                    ┌──────────────┐
                    │   Porteiro   │
                    └──────┬───────┘
                           │
                       valida
                           │
                           ▼
                    ┌──────────────┐
                    │ Ticket USED  │
                    └──────────────┘
```

---

# Testando o fluxo

Uma sequência recomendada para testar a aplicação é:

### 1. Criar usuários

Criar usuários com os perfis:

```text
CLIENT
ORGANIZER
GATEKEEPER
```

### 2. Organizador cria um evento

O organizador seleciona um evento disponível e informa:

```text
capacity
price
```

### 3. Cliente compra

O cliente:

```text
Seleciona evento
      ↓
Escolhe quantidade
      ↓
Compra
```

O backend cria:

```text
Reservation
Payment
Ticket(s)
```

### 4. Cliente apresenta o ingresso

O frontend gera o QR Code utilizando o `shareToken`.

### 5. Porteiro valida

O porteiro:

```text
Seleciona evento
      ↓
Abre câmera
      ↓
Lê QR Code
      ↓
Envia shareToken
      ↓
Backend valida
```

### 6. Segunda tentativa

Se o mesmo ingresso for utilizado novamente:

```text
TicketStatus = USED
```

A API rejeita a entrada.

---

# Tratamento de erros

O backend utiliza exceções HTTP do NestJS.

Exemplos utilizados:

```typescript
NotFoundException;
BadRequestException;
```

Exemplo:

```typescript
if (!event) {
  throw new NotFoundException('Event not found');
}
```

E:

```typescript
if (ticket.status !== TicketStatus.VALID) {
  throw new BadRequestException('Ticket already used');
}
```

Isso permite que o frontend receba respostas HTTP adequadas e apresente mensagens ao usuário.

---

# Regras de negócio importantes

### Evento inexistente

Uma compra não pode ser realizada se o evento não existir.

### Capacidade

O evento possui:

```text
capacity
soldCount
```

A quantidade vendida deve respeitar a capacidade definida.

### Ingresso

Cada ingresso pertence a:

```text
owner
event
reservation
```

### Validação

Somente ingressos válidos podem ser utilizados.

### Reutilização

Um ingresso já utilizado não pode ser validado novamente.

### Portaria

Somente usuários com perfil `GATEKEEPER` podem validar ingressos.

### Organização

Somente usuários `ORGANIZER` podem criar eventos.

### Compra

Somente usuários `CLIENT` podem comprar ingressos através do endpoint de compra.

---

# Separação de responsabilidades

O backend utiliza uma divisão clara:

```text
Controller
    │
    │ recebe HTTP
    ▼
Service
    │
    │ regras de negócio
    ▼
Repository
    │
    │ persistência
    ▼
Prisma
    │
    ▼
PostgreSQL
```

### Controller

Responsável por:

- Rotas.
- HTTP.
- Guards.
- DTOs.
- Receber parâmetros.

### Service

Responsável por:

- Regras de negócio.
- Fluxos de compra.
- Validação.
- Integrações.

### Repository

Responsável por:

- Consultas.
- Inserts.
- Updates.
- Relacionamentos.

### Prisma

Responsável pela comunicação com o banco.

---

# Possíveis melhorias futuras

Algumas evoluções possíveis para o backend:

- [ ] Implementar gateway de pagamento real.
- [ ] Adicionar controle de concorrência mais robusto para compras simultâneas.
- [ ] Criar testes unitários para services.
- [ ] Criar testes de integração.
- [ ] Criar testes E2E.
- [ ] Documentar a API com Swagger.
- [ ] Implementar refresh token.
- [ ] Implementar recuperação de senha.
- [ ] Criar histórico completo de validações.
- [ ] Adicionar cancelamento de ingressos.
- [ ] Criar reembolso.
- [ ] Criar dashboard do organizador.
- [ ] Adicionar paginação.
- [ ] Adicionar filtros e busca de eventos.
- [ ] Implementar rate limiting.
- [ ] Melhorar logs e observabilidade.
- [ ] Adicionar Docker.
- [ ] Configurar CI/CD.
- [ ] Deploy automatizado.
- [ ] Melhorar controle transacional da compra de ingressos.

---

# Integração com o frontend

O frontend do Ingressinho consome essa API para:

```text
Autenticação
      │
      ├── Login
      └── Cadastro

Eventos
      │
      ├── Listagem
      ├── Eventos do organizador
      └── Eventos da portaria

Ingressos
      │
      ├── Compra
      ├── Meus ingressos
      ├── Consulta
      └── Validação
```

A integração entre os projetos permite o seguinte fluxo:

```text
React
  │
  │ HTTP
  ▼
NestJS
  │
  ├── Auth
  ├── Events
  └── Tickets
       │
       ▼
    Prisma
       │
       ▼
 PostgreSQL
```

---

# Licença

Projeto desenvolvido para fins educacionais e de portfólio.

---

<p align="center">
  🎟️ <strong>Ingressinho</strong>
  <br />
  Backend desenvolvido com NestJS, Prisma e PostgreSQL.
  <br /><br />
  Crie. Compre. Valide. Festeje. 🎉
</p>
