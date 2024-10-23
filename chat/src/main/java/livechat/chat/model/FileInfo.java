package livechat.chat.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileInfo {
    private String fileName;
    private String fileType;
    private String fileUrl;
    private long fileSize;
}
