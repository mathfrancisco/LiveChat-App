package livechat.app.livechat.domain;

import java.text.SimpleDateFormat;
import java.util.Date;

public record ChatOutput(String user, String content, String time, String type) {

    // Construtor alternativo para definir o time e o type automaticamente
    public ChatOutput(String user, String content) {
        this(user, content, new SimpleDateFormat("HH:mm").format(new Date()), "CHAT");
    }
}
