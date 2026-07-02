package com.arjun.crm.dto.request;

import com.arjun.crm.enums.ChatRoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatRoomCreateRequest {

    @NotBlank(message = "Chat room name is required")
    @Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
    private String name;

    @NotNull(message = "Chat room type is required")
    private ChatRoomType type;

    @NotNull(message = "Workspace ID is required")
    private Long workspaceId;
    
    private Long projectId;

    @NotEmpty(message = "At least one participant is required")
    private List<Long> participantIds;
}
