# 💬 LiveChat-App

## 📌 Visão Geral

O **LiveChat-App** é uma aplicação de chat em tempo real moderna e escalável, desenvolvida com React e Spring Boot. A plataforma oferece comunicação instantânea através de WebSockets, com suporte a mensagens públicas, privadas, compartilhamento de arquivos e recursos avançados de presença de usuários.

-----

## 🎯 Requisitos Funcionais

### RF01 - Autenticação e Gestão de Usuários

- **RF01.1**: Registro de usuário com nome único
- **RF01.2**: Login/logout com validação de sessão
- **RF01.3**: Visualização de perfil de usuário
- **RF01.4**: Lista de usuários online em tempo real

### RF02 - Mensagens

- **RF02.1**: Envio e recebimento de mensagens em tempo real
- **RF02.2**: Chat em grupo (sala pública)
- **RF02.3**: Mensagens privadas entre usuários
- **RF02.4**: Histórico de mensagens (últimas 100 por canal)
- **RF02.5**: Indicadores de status: enviada, entregue, lida
- **RF02.6**: Suporte a emojis e formatação básica de texto

### RF03 - Compartilhamento de Arquivos

- **RF03.1**: Upload de imagens (PNG, JPG, JPEG - max 5MB)
- **RF03.2**: Upload de documentos PDF (max 10MB)
- **RF03.3**: Pré-visualização de imagens no chat
- **RF03.4**: Download de arquivos compartilhados

### RF04 - Recursos Avançados

- **RF04.1**: Compartilhamento de tela em tempo real
- **RF04.2**: Notificações push para novas mensagens
- **RF04.3**: Indicador de digitação (“usuário está digitando…”)
- **RF04.4**: Busca no histórico de mensagens
- **RF04.5**: Tema claro/escuro

### RF05 - Administração

- **RF05.1**: Moderação de mensagens
- **RF05.2**: Banimento temporário de usuários
- **RF05.3**: Logs de atividades do sistema

-----

## 🔒 Requisitos Não Funcionais

### RNF01 - Performance

- **RNF01.1**: Latência máxima de 100ms para entrega de mensagens
- **RNF01.2**: Suporte a 1000 usuários simultâneos por instância
- **RNF01.3**: Carregamento inicial da aplicação em menos de 2s
- **RNF01.4**: Otimização de bundle do frontend (< 500KB gzipped)

### RNF02 - Escalabilidade

- **RNF02.1**: Arquitetura stateless para escalonamento horizontal
- **RNF02.2**: Uso de Redis para sessões distribuídas
- **RNF02.3**: Load balancing automático no Railway

### RNF03 - Segurança

- **RNF03.1**: Comunicação via WebSocket Seguro (WSS)
- **RNF03.2**: Criptografia TLS 1.3
- **RNF03.3**: Sanitização de inputs (prevenção XSS)
- **RNF03.4**: Rate limiting: 60 mensagens/minuto por usuário
- **RNF03.5**: Validação de tipos de arquivo no upload
- **RNF03.6**: CORS configurado para domínios específicos

### RNF04 - Disponibilidade

- **RNF04.1**: Uptime de 99.5%
- **RNF04.2**: Reconnexão automática do WebSocket
- **RNF04.3**: Fallback para polling em caso de falha do WebSocket
- **RNF04.4**: Health checks a cada 30 segundos

### RNF05 - Usabilidade

- **RNF05.1**: Interface responsiva (mobile-first)
- **RNF05.2**: Suporte a navegadores modernos (últimas 2 versões)
- **RNF05.3**: Acessibilidade WCAG 2.1 nível AA
- **RNF05.4**: Feedback visual para todas as ações

### RNF06 - Manutenibilidade

- **RNF06.1**: Cobertura de testes unitários > 80%
- **RNF06.2**: Documentação técnica atualizada
- **RNF06.3**: Logs estruturados (JSON format)
- **RNF06.4**: Monitoramento via Railway Metrics

-----

## 🗄️ Diagrama de Banco de Dados

```mermaid
erDiagram
    USUARIO ||--o{ MENSAGEM : envia
    USUARIO ||--o{ SESSAO : possui
    USUARIO ||--o{ ARQUIVO : compartilha
    SALA ||--o{ MENSAGEM : contem
    SALA ||--o{ USUARIO_SALA : possui
    USUARIO ||--o{ USUARIO_SALA : participa
    MENSAGEM ||--o{ ARQUIVO : anexa

    USUARIO {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar senha_hash
        timestamp criado_em
        timestamp ultimo_acesso
        boolean ativo
        enum status "ONLINE,OFFLINE,AUSENTE"
    }

    SESSAO {
        uuid id PK
        uuid usuario_id FK
        varchar token UK
        timestamp criado_em
        timestamp expira_em
        varchar ip_address
    }

    SALA {
        uuid id PK
        varchar nome
        enum tipo "PUBLICA,PRIVADA"
        timestamp criado_em
        uuid criador_id FK
    }

    MENSAGEM {
        uuid id PK
        uuid remetente_id FK
        uuid sala_id FK
        text conteudo
        timestamp enviado_em
        boolean editada
        boolean deletada
        enum status "ENVIADA,ENTREGUE,LIDA"
    }

    USUARIO_SALA {
        uuid id PK
        uuid usuario_id FK
        uuid sala_id FK
        timestamp entrou_em
        timestamp saiu_em
        boolean moderador
    }

    ARQUIVO {
        uuid id PK
        uuid mensagem_id FK
        uuid usuario_id FK
        varchar nome_original
        varchar nome_armazenado
        varchar tipo_mime
        bigint tamanho_bytes
        varchar url_s3
        timestamp enviado_em
    }
```

-----

## 🔄 Diagramas de Fluxo

### Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend (React)
    participant B as Backend (Spring Boot)
    participant R as Redis
    participant DB as PostgreSQL

    U->>F: Acessa aplicação
    F->>B: GET /api/health
    B-->>F: Status OK
    
    U->>F: Insere username
    F->>B: POST /api/auth/register
    B->>DB: Verifica username único
    DB-->>B: Username disponível
    B->>DB: Cria usuário
    B->>R: Armazena sessão
    B-->>F: Token JWT + userData
    F->>F: Armazena token (localStorage)
    F->>B: Conecta WebSocket com token
    B->>R: Valida sessão
    B-->>F: Conexão estabelecida
    F-->>U: Redireciona para chat
```

### Fluxo de Mensagens

```mermaid
sequenceDiagram
    participant U1 as Usuário 1
    participant F1 as Frontend 1
    participant B as Backend
    participant WS as WebSocket Broker
    participant F2 as Frontend 2
    participant U2 as Usuário 2
    participant DB as PostgreSQL

    U1->>F1: Digita mensagem
    F1->>F1: Mostra indicador "digitando"
    F1->>B: WS: /app/chat.sendMessage
    B->>B: Valida e sanitiza conteúdo
    B->>DB: Persiste mensagem
    B->>WS: Publica em /topic/public
    
    WS->>F1: Entrega mensagem
    F1->>F1: Atualiza UI (status: enviada)
    F1-->>U1: Exibe mensagem
    
    WS->>F2: Entrega mensagem
    F2->>B: WS: /app/chat.markAsRead
    F2-->>U2: Notificação + exibe mensagem
    
    B->>DB: Atualiza status: lida
    B->>WS: Publica confirmação leitura
    WS->>F1: Confirmação de leitura
    F1->>F1: Atualiza status: lida
```

### Fluxo de Upload de Arquivo

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant S3 as Railway Volume
    participant DB as PostgreSQL
    participant WS as WebSocket

    U->>F: Seleciona arquivo
    F->>F: Valida tipo/tamanho
    F->>B: POST /api/files/upload (multipart)
    B->>B: Valida arquivo
    B->>B: Gera nome único
    B->>S3: Upload para volume
    S3-->>B: URL do arquivo
    B->>DB: Salva metadados
    B->>WS: Publica mensagem com anexo
    WS->>F: Entrega mensagem
    F-->>U: Exibe arquivo no chat
```

### Fluxo de Reconexão

```mermaid
flowchart TD
    A[WebSocket desconectado] --> B{Tentativa < 5?}
    B -->|Sim| C[Aguarda backoff exponencial]
    C --> D[Tenta reconectar]
    D --> E{Sucesso?}
    E -->|Sim| F[Reconectado]
    E -->|Não| G[Incrementa tentativa]
    G --> B
    B -->|Não| H[Exibe erro ao usuário]
    H --> I[Ativa fallback polling]
    F --> J[Resincroniza mensagens]
    J --> K[Volta ao normal]
```

-----

## 🚀 Tecnologias Utilizadas

### Backend

- **Java 21 LTS** - Linguagem base
- **Spring Boot 3.3.x** - Framework principal
- **Spring WebSocket 6.1.x** - Comunicação real-time
- **Spring Data JPA 3.3.x** - Persistência de dados
- **PostgreSQL 16** - Banco de dados relacional
- **Redis 7.2** - Cache e sessões distribuídas
- **Lombok 1.18.x** - Redução de boilerplate
- **Flyway 10.x** - Migrations de banco
- **JUnit 5 & Mockito** - Testes automatizados

### Frontend

- **React 18.3.x** - Framework UI
- **TypeScript 5.5.x** - Tipagem estática
- **Vite 5.x** - Build tool moderna
- **TanStack Query 5.x** - Gerenciamento de estado server
- **Zustand 4.x** - Gerenciamento de estado cliente
- **Socket.IO Client 4.7.x** - WebSocket client
- **Tailwind CSS 3.4.x** - Estilização utility-first
- **Radix UI** - Componentes acessíveis
- **React Hook Form 7.x** - Gerenciamento de formulários
- **Zod 3.x** - Validação de schemas

### DevOps & Deploy

- **Railway** - Plataforma de deploy
- **Docker** - Containerização
- **GitHub Actions** - CI/CD
- **Sentry** - Monitoramento de erros
- **Railway Metrics** - Observabilidade

-----

## 💻 Requisitos do Sistema

### Desenvolvimento

- Node.js 20.x LTS
- Java JDK 21 LTS
- Docker 24.x
- Git 2.x
- PostgreSQL 16 (local ou Docker)
- Redis 7.2 (local ou Docker)

-----

## 🛠 Configuração e Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/mathfrancisco/livechat-app.git
cd livechat-app
```

### 2. Configure Variáveis de Ambiente

Crie um arquivo `.env` na raiz do backend:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/livechat
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=86400000

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/png,image/jpeg,application/pdf

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Railway (produção)
PORT=8080
```

Crie um arquivo `.env` na raiz do frontend:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_MAX_FILE_SIZE=10485760
```

### 3. Backend

```bash
cd backend

# Com Docker
docker-compose up -d postgres redis

# Sem Docker - instale PostgreSQL e Redis localmente

# Execute migrations
./mvnw flyway:migrate

# Instale dependências e execute
./mvnw clean install
./mvnw spring-boot:run
```

Backend disponível em `http://localhost:8080`

### 4. Frontend

```bash
cd frontend

# Instale dependências
npm install

# Execute em desenvolvimento
npm run dev
```

Frontend disponível em `http://localhost:5173`

-----

## 📁 Estrutura do Projeto

```
livechat-app/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/livechat/
│   │   │   │   ├── config/
│   │   │   │   │   ├── WebSocketConfig.java
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   └── RedisConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── ChatController.java
│   │   │   │   │   └── FileController.java
│   │   │   │   ├── model/
│   │   │   │   │   ├── Usuario.java
│   │   │   │   │   ├── Mensagem.java
│   │   │   │   │   ├── Sala.java
│   │   │   │   │   └── Arquivo.java
│   │   │   │   ├── repository/
│   │   │   │   ├── service/
│   │   │   │   ├── dto/
│   │   │   │   └── exception/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/
│   │   └── test/
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   ├── MessageList/
│   │   │   ├── UserList/
│   │   │   └── FileUpload/
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useChat.ts
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── websocket.ts
│   │   │   └── auth.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   └── chatStore.ts
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── docker-compose.yml
├── railway.json
└── README.md
```

-----

## 🚢 Deploy no Railway

### 1. Preparação

Crie um arquivo `railway.json` na raiz:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Backend (Spring Boot)

Crie `Dockerfile` no backend:

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
```

Configure `application-prod.yml`:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
  data:
    redis:
      url: ${REDIS_URL}
server:
  port: ${PORT:8080}
```

### 3. Frontend (React)

Crie `Dockerfile` no frontend:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Crie `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 4. Deploy

```bash
# Instale Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicialize projeto
railway init

# Adicione PostgreSQL
railway add --plugin postgresql

# Adicione Redis
railway add --plugin redis

# Deploy backend
cd backend
./mvnw clean package -DskipTests
railway up

# Deploy frontend
cd ../frontend
railway up

# Configure domínio customizado (opcional)
railway domain
```

### 5. Variáveis de Ambiente no Railway

Configure no dashboard:

- `DATABASE_URL` (auto-gerada pelo Railway)
- `REDIS_URL` (auto-gerada)
- `JWT_SECRET`
- `ALLOWED_ORIGINS` (URL do frontend)

-----

## 🧪 Testes

### Backend

```bash
# Testes unitários
./mvnw test

# Testes de integração
./mvnw verify

# Cobertura
./mvnw jacoco:report
```

### Frontend

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

-----

## 📈 Monitoramento

- **Railway Metrics**: CPU, memória, rede
- **Logs estruturados**: JSON format via Railway CLI
- **Health checks**: `/api/health` endpoint
- **Sentry**: Rastreamento de erros em produção

-----

## 🔐 Segurança

- ✅ HTTPS obrigatório em produção
- ✅ WSS para WebSocket
- ✅ JWT com expiração
- ✅ Rate limiting (60 req/min)
- ✅ Sanitização de inputs
- ✅ Validação de uploads
- ✅ CORS restrito
- ✅ Secrets no Railway Vault

-----

## 🤝 Contribuição

1. Fork o projeto
1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
1. Commit: `git commit -m 'Adiciona nova funcionalidade'`
1. Push: `git push origin feature/nova-funcionalidade`
1. Abra um Pull Request

-----

## 📜 Licença

MIT License - veja <LICENSE>

-----

## 👨‍💻 Autor

**Matheus Francisco**

- GitHub: [@mathfrancisco](https://github.com/mathfrancisco)
- LinkedIn: [Seu perfil](https://linkedin.com/in/seu-perfil)

-----

