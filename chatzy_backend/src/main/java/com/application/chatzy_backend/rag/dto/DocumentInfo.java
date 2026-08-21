package com.application.chatzy_backend.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentInfo {
    private String documentId;
    private String filename;
    private String uploadedAt;
}
