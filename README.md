# 💬 LiveChat-App

## 📌 Visão Geral

O **LiveChat-App** é uma aplicação de chat em tempo real robusta e escalável, projetada para fornecer uma experiência de comunicação fluida e eficiente. Utilizando tecnologias modernas tanto no frontend quanto no backend, esta aplicação oferece recursos de chat em grupo e privado, com uma interface de usuário intuitiva e responsiva.

## 🌟 Funcionalidades Principais

- **Chat em Tempo Real**: 
  - Comunicação instantânea entre usuários sem necessidade de recarregar a página.
  - Suporte para salas de chat públicas (chatroom) e mensagens privadas.
  - Notificações em tempo real para novas mensagens.

- **Sistema de Usuários**:
  - Registro simplificado de usuários com nome de usuário único.
  - Lista dinâmica de usuários online.
  - Status de presença (online/offline) para cada usuário.

- **Interface de Usuário**:
  - Design responsivo para desktop e dispositivos móveis.
  - Alternância fácil entre chats públicos e privados.
  - Indicadores visuais para mensagens enviadas, recebidas e lidas.
  - Suporte para emojis e formatação básica de texto.
  - Modo Claro e Escuro: Escolha entre um tema claro ou escuro, adaptando a interface para um visual mais confortável ao seu gosto.
 
- **Compartilhamento de Arquivos**:
  - Suporte a Imagens e PDFs: Envie e compartilhe fotos, documentos e arquivos em PDF diretamente pelo chat, facilitando a troca de informações.
  - Compartilhamento de Tela: Mostre sua tela em tempo real durante conversas, ideal para reuniões, suporte remoto e apresentações.

- **Segurança**:
  - Comunicação criptografada via WebSocket seguro (WSS).
  - Sanitização de input para prevenir ataques XSS.
  - Limitação de taxa para prevenir spam.

## 🏗 Arquitetura

### Backend
- Desenvolvido em Java com Spring Boot, oferecendo uma base robusta e escalável.
- Utiliza WebSocket para comunicação em tempo real, permitindo mensagens bidirecionais.
- Implementa o protocolo STOMP sobre WebSocket para mensagens estruturadas.
- Armazenamento em memória para sessões de usuário e histórico de chat recente.

### Frontend
- Construído com Angular, proporcionando uma Single Page Application (SPA) reativa.
- Utiliza RxJS para gerenciamento de estado e fluxos de dados assíncronos.
- Implementa o padrão Observable para comunicação em tempo real com o backend.

### Fluxo de Dados
1. O cliente se conecta ao servidor via WebSocket.
2. O servidor autentica o cliente e estabelece uma sessão.
3. O cliente subscreve-se a canais relevantes (chatroom público, canais privados).
4. As mensagens são enviadas e recebidas através desses canais em tempo real.

## 🚀 Tecnologias Utilizadas

### Backend
- **Java 11+**: Linguagem de programação principal.
- **Spring Boot 2.7+**: Framework para criação de aplicações Java.
- **Spring WebSocket**: Módulo do Spring para suporte a WebSocket.
- **Project Lombok**: Redução de código boilerplate.
- **SLF4J & Logback**: Logging.
- **JUnit 5 & Mockito**: Testes unitários e de integração.

### Frontend
- **Angular 16+**: Framework para desenvolvimento do cliente web.
- **TypeScript 4.9+**: Superset tipado de JavaScript.
- **RxJS 7+**: Biblioteca para programação reativa.
- **@stomp/stompjs**: Cliente STOMP para WebSocket.
- **sockjs-client**: Fallback para browsers sem suporte nativo a WebSocket.
- **Bootstrap 5**: Framework CSS para design responsivo.

## 💻 Requisitos do Sistema

### Desenvolvimento
- Java Development Kit (JDK) 11 ou superior
- Node.js 16.x ou superior
- npm 7.x ou superior
- Maven 3.6.x ou superior
- Git

## 🛠 Configuração e Instalação

### Backend

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/livechat-app.git
   ```
2. Navegue até a pasta do backend:
   ```
   cd livechat-app/backend
   ```
3. Compile e execute os testes:
   ```
   mvn clean install
   ```
4. Execute a aplicação:
   ```
   mvn spring-boot:run
   ```

O backend estará rodando em `http://localhost:8080`.

### Frontend

1. Navegue até a pasta do frontend:
   ```
   cd livechat-app/frontend
   ```
2. Instale as dependências:
   ```
   npm install
   ```
3. Execute o servidor de desenvolvimento:
   ```
   ng serve
   ```

O frontend estará disponível em `http://localhost:4200`.

## 📁 Estrutura do Projeto

```
livechat-app/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/livechat/
│   │   │   │   ├── config/
│   │   │   │   │   └── WebSocketConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   └── ChatController.java
│   │   │   │   ├── model/
│   │   │   │   │   ├── Message.java
│   │   │   │   │   └── Status.java
│   │   │   │   └── LiveChatApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/
│   │   │   │   └── web-socket.service.ts
│   │   │   ├── components/
│   │   │   │   └── chat-room/
│   │   │   │       ├── chat-room.component.ts
│   │   │   │       ├── chat-room.component.html
│   │   │   │       └── chat-room.component.css
│   │   │   ├── app.module.ts
│   │   │   └── app.component.ts
│   │   ├── assets/
│   │   └── index.html
│   ├── angular.json
│   └── package.json
└── README.md
```

## 🚀 Build e Deploy

### Preparação para Produção

1. **Build do Frontend**:
   ```
   cd frontend
   ng build --prod
   ```

2. **Integração com o Backend**:
   ```
   cp -R dist/* ../backend/src/main/resources/static/
   ```

3. **Build do Backend**:
   ```
   cd ../backend
   mvn clean package
   ```

### Deploy na AWS Elastic Beanstalk

1. Acesse o [Console AWS Elastic Beanstalk](https://console.aws.amazon.com/elasticbeanstalk).
2. Clique em "Create a new environment".
3. Escolha "Web server environment".
4. Em "Platform", selecione "Java" e a versão apropriada.
5. Em "Application code", escolha "Upload your code" e faça upload do arquivo JAR gerado.
6. Configure as opções de ambiente conforme necessário (ex: tamanho da instância, variáveis de ambiente).
7. Revise e confirme as configurações.
8. Clique em "Create environment" para iniciar o deploy.

O processo de deploy pode levar alguns minutos. Uma vez concluído, a AWS fornecerá um URL para acessar sua aplicação.

## 🐞 Troubleshooting

- **Problema de Conexão WebSocket**: Verifique se o frontend está utilizando o protocolo correto (ws:// para desenvolvimento local, wss:// para produção).
- **Mensagens não chegando em tempo real**: Certifique-se de que o CORS está configurado corretamente no backend.
- **Erros de build no frontend**: Verifique a compatibilidade das versões das dependências no `package.json`.

## 🧪 Testes

### Backend
Execute os testes unitários e de integração com:
```
mvn test
```

### Frontend
Execute os testes unitários com:
```
ng test
```

## 📈 Monitoramento e Logs

- Utilize o Amazon CloudWatch para monitorar métricas de performance e logs da aplicação quando hospedada na AWS.
- Para ambientes locais ou outros provedores, considere implementar o ELK stack (Elasticsearch, Logstash, Kibana) para análise de logs centralizada.

## 🛡 Segurança

- Mantenha todas as dependências atualizadas regularmente.
- Implemente rate limiting no backend para prevenir ataques de força bruta.
- Use HTTPS em produção para criptografar todo o tráfego.
- Sanitize todas as entradas de usuário para prevenir XSS e injeção de SQL.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, siga estes passos:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Faça commit das suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📜 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## 👨‍💻 Autor

- **[Matheus Francisco]** - *Trabalho inicial* - [@seuGitHub](https://github.com/mathfrancisco)

