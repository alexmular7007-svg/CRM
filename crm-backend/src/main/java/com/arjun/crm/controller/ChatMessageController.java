package com.arjun.crm.controller;

import com.arjun.crm.dto.request.ChatMessageRequest;
import com.arjun.crm.dto.request.ChatMessageUpdateRequest;
import com.arjun.crm.dto.response.ApiResponse;
import com.arjun.crm.dto.response.ChatMessageResponse;
import com.arjun.crm.service.ChatMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/chat/messages")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    /** POST /api/chat/messages — send a text message */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody ChatMessageRequest request) {
        ChatMessageResponse response = chatMessageService.sendMessage(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", response));
    }

    /**
     * POST /api/chat/messages/upload?roomId={roomId}
     * Upload a file (PDF, DOCX, XLSX, PPTX, image) and send it as a chat message.
     * The backend stores the file, generates a download URL, and broadcasts
     * the message with attachmentUrl via WebSocket so receivers can download it.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("roomId") Long roomId) {
        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChatMessageController.class);
        log.info("[1] Controller.upload() entered - roomId: {}, fileName: {}", roomId, file.getOriginalFilename());
        try {
            log.info("[2] MultipartFile received - size: {} bytes", file.getSize());
            ChatMessageResponse response = chatMessageService.sendFileMessage(roomId, file);
            log.info("[18] Response prepared - returning to client");
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("File sent successfully", response));
        } catch (Exception e) {
            log.error("[X] FAILED in Controller.upload()", e);
            throw e;
        }
    }

    /** GET /api/chat/messages/rooms/{roomId} — paginated message history */
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessageResponse> messages = chatMessageService.getMessages(roomId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Messages retrieved successfully", messages));
    }

    /** PUT /api/chat/messages/{id} — edit a message */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> updateMessage(
            @PathVariable Long id,
            @Valid @RequestBody ChatMessageUpdateRequest request) {
        ChatMessageResponse response = chatMessageService.updateMessage(id, request);
        return ResponseEntity.ok(ApiResponse.success("Message updated successfully", response));
    }

    /** DELETE /api/chat/messages/{id} — soft-delete a message */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable Long id) {
        chatMessageService.deleteMessage(id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", null));
    }
}
