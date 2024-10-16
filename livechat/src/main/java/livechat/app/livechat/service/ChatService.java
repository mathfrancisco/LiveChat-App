package livechat.app.livechat.service;

import livechat.app.livechat.domain.ChatOutput;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;


import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class ChatService {

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");

    public ChatOutput processMessage(String username, String message) {
        String time = LocalDateTime.now().format(formatter);
        String escapedMessage = HtmlUtils.htmlEscape(message);
        return new ChatOutput(username, escapedMessage, time, "CHAT");
    }

    public ChatOutput userJoined(String username) {
        String time = LocalDateTime.now().format(formatter);
        return new ChatOutput(username, username + " joined the chat", time, "JOIN");
    }
}
