package livechat.app.livechat.controller;

import livechat.app.livechat.domain.ChatInput;
import livechat.app.livechat.domain.ChatOutput;
import livechat.app.livechat.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class LiveChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatInput chatInput, SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        ChatOutput output = chatService.processMessage(username, chatInput.message());
        messagingTemplate.convertAndSend("/topic/public", output);
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatInput chatInput, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatInput.user());
        ChatOutput output = chatService.userJoined(chatInput.user());
        messagingTemplate.convertAndSend("/topic/public", output);
    }
}
