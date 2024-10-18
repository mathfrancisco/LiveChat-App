# 💬 LiveChat-App

O **LiveChat-App** é uma aplicação de chat em tempo real que permite aos usuários se comunicarem através de salas de chat públicas e mensagens privadas. Desenvolvida com tecnologias modernas, esta aplicação oferece uma experiência de chat fluida e responsiva.

## 📌 Funcionalidades

- **Chat em Tempo Real**: 
  - Comunicação instantânea entre usuários.
  - Suporte para salas de chat públicas e mensagens privadas.

- **Sistema de Usuários**:
  - Registro simplificado de usuários.
  - Lista de usuários online.

- **Interface Intuitiva**:
  - Alternância fácil entre chats públicos e privados.
  - Indicadores visuais para mensagens enviadas e recebidas.

## 🎨 Arquitetura

- **Backend**: 
  - Desenvolvido em Java com Spring Boot.
  - Utiliza WebSocket para comunicação em tempo real.

- **Frontend**: 
  - Construído com Angular, oferecendo uma interface de usuário dinâmica e responsiva.

- **Comunicação**: 
  - Integração entre frontend e backend através do protocolo STOMP sobre WebSocket.

## 🚀 Tecnologias Utilizadas

### Backend

- **Java**: Linguagem de programação principal para o backend.
- **Spring Boot**: Framework para criação de aplicações Java robustas e escaláveis.
- **Spring WebSocket**: Módulo do Spring para suporte a WebSocket.
- **Lombok**: Biblioteca para redução de código boilerplate em Java.

### Frontend

- **Angular**: Framework JavaScript para desenvolvimento de interfaces de usuário.
- **@stomp/stompjs**: Cliente STOMP para comunicação WebSocket.
- **sockjs-client**: Cliente WebSocket com fallback para navegadores mais antigos.
- **RxJS**: Biblioteca para programação reativa em JavaScript.

## 🛠 Configuração e Instalação

### Backend

1. Certifique-se de ter o Java JDK e o Maven instalados.
2. Clone o repositório e navegue até a pasta do backend.
3. Execute `mvn spring-boot:run` para iniciar o servidor.

### Frontend

1. Certifique-se de ter o Node.js e o npm instalados.
2. Navegue até a pasta do frontend.
3. Execute `npm install` para instalar as dependências.
4. Execute `ng serve` para iniciar o servidor de desenvolvimento.

## 🚀 Uso

1. Abra o navegador e acesse `http://localhost:4200`.
2. Insira seu nome de usuário e clique em "connect".
3. Você será direcionado para a sala de chat pública.
4. Para iniciar um chat privado, clique no nome de outro usuário na lista.

## 🧑‍💻 Desenvolvimento

O projeto está estruturado da seguinte forma:

- `backend/`: Contém o código Java do servidor.
  - `WebSocketConfig.java`: Configuração do WebSocket.
  - `ChatController.java`: Controlador para gerenciar mensagens.
  - `Message.java` e `Status.java`: Modelos de dados.

- `frontend/`: Contém o código Angular do cliente.
  - `web-socket.service.ts`: Serviço para gerenciar a conexão WebSocket.
  - `chat-room.component.ts`: Componente principal do chat.

## 🚀 Build e Deploy

Após garantir que a aplicação está funcionando corretamente em ambiente local, siga estes passos para preparar e implantar a aplicação:

1. **Build do Frontend**:
   - Navegue até a pasta do frontend.
   - Execute `ng build --prod` para criar uma versão otimizada para produção.
   - Os arquivos gerados estarão na pasta `dist/`.

2. **Integração com o Backend**:
   - Copie todos os arquivos da pasta `dist/` para a pasta `src/main/resources/static/` do projeto backend.

3. **Build do Backend**:
   - Navegue até a pasta raiz do projeto backend.
   - Execute `mvn clean package` para criar o arquivo JAR.
   - O arquivo JAR será gerado na pasta `target/`.

4. **Deploy na AWS Elastic Beanstalk**:
   - Faça login no console da AWS e navegue até o Elastic Beanstalk.
   - Crie um novo ambiente ou selecione um existente.
   - Faça upload do arquivo JAR gerado.
   - Configure as opções de ambiente conforme necessário.
   - Implante a aplicação.

Após esses passos, sua aplicação LiveChat-App estará rodando na AWS Elastic Beanstalk, pronta para uso em um ambiente de produção.

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📜 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## 👨‍💻 Autor

- - Matheus Francisco - [GitHub](https://github.com/mathfrancisco)
