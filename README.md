# RestrictChat

Chat em tempo real onde cada sala possui um **tema definido** e uma **IA moderadora** que bloqueia mensagens fora do contexto.

🔗 **[Acesse o projeto](https://restrict-chat.vercel.app)**

---

## Funcionalidades

- Cadastro e login com autenticação JWT
- Criação de salas com nome e tema personalizado
- Chat em tempo real via WebSocket (SignalR)
- **Moderação por IA** — analisa as últimas 10 mensagens como contexto antes de aprovar ou rejeitar a nova
- Adição de membros por e-mail
- Listagem de membros com identificação do dono
- Exclusão de sala (apenas pelo dono), removendo histórico completo
- Histórico de mensagens persistido por sala

---

## Arquitetura do Backend

O backend segue o padrão **Vertical Slice Architecture**: cada funcionalidade é autocontida em um único arquivo com request, validação, handler e endpoint juntos. Não há camadas horizontais separadas (Controllers, Services, Repositories genéricos).

```
RestrictChat.Api/
├── Features/
│   ├── Auth/
│   │   ├── Register.cs         # POST /auth/register
│   │   └── Login.cs            # POST /auth/login
│   ├── Rooms/
│   │   ├── CreateRoom.cs       # POST /rooms
│   │   ├── GetRooms.cs         # GET  /rooms
│   │   ├── DeleteRoom.cs       # DELETE /rooms/{id}
│   │   ├── AddMember.cs        # POST /rooms/{id}/members
│   │   └── GetMembers.cs       # GET  /rooms/{id}/members
│   ├── Users/
│   │   └── SearchUser.cs       # GET  /users/search?email=
│   ├── Messages/
│   │   └── GetHistory.cs       # GET  /rooms/{id}/messages
│   └── Moderation/
│       └── ModerationService.cs
├── Hubs/
│   └── ChatHub.cs              # WebSocket via SignalR
├── Infrastructure/
│   ├── Postgres/               # EF Core — usuários, salas, membros
│   └── Mongo/                  # MongoDB — histórico de mensagens
└── Common/
    └── Extensions/             # JWT, TokenService
```

### Fluxo de uma mensagem

```
Cliente → SignalR (SendMessage)
    → Valida membro
    → Envia MessagePending ao remetente
    → ModerationService: últimas 10 msgs + nova → Groq API (LLaMA 3.1)
        ├── Aprovada → salva no MongoDB → broadcast ReceiveMessage para a sala
        └── Rejeitada → envia MessageRejected ao remetente
```

---

## Banco de Dados

Dois bancos com responsabilidades distintas (**Polyglot Persistence**):

| Dado | Banco | Motivo |
|---|---|---|
| Usuários, Salas, Membros | **PostgreSQL** | Dados relacionais, necessidade de JOINs e integridade referencial |
| Mensagens | **MongoDB** | Alto volume, acesso sempre por `roomId + data`, sem necessidade de relacionamentos |

---

## Tecnologias

### Backend
- **.NET 9** — ASP.NET Core Minimal APIs
- **SignalR** — comunicação em tempo real via WebSocket
- **Entity Framework Core + Npgsql** — ORM para PostgreSQL
- **MongoDB.Driver** — acesso ao MongoDB
- **FluentValidation** — validação de requests
- **BCrypt** — hash de senhas
- **JWT Bearer** — autenticação stateless
- **Groq API (LLaMA 3.1 8B)** — moderação de mensagens por IA

### Frontend
- **React + Vite**
- **Material UI (MUI)** — componentes e tema
- **Zustand** — gerenciamento de estado global
- **@microsoft/signalr** — cliente WebSocket
- **Axios** — requisições HTTP

### Infraestrutura
- **Render** — deploy do backend (Docker)
- **Vercel** — deploy do frontend
- **Neon** — PostgreSQL serverless
- **MongoDB Atlas** — MongoDB gerenciado

---

## Variáveis de Ambiente

### Backend (Render)
```
ConnectionStrings__Postgres=Host=...;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
ConnectionStrings__MongoDB=mongodb+srv://...
Jwt__SecretKey=...
Jwt__Issuer=RestrictChat
Jwt__Audience=RestrictChat
Jwt__ExpirationInHours=168
MongoDB__DatabaseName=restrictchat
Groq__ApiKey=...
Frontend__Url=https://restrict-chat.vercel.app
```

### Frontend (Vercel)
```
VITE_API_URL=https://restrictchat.onrender.com
```
