package com.application.chatzy_backend.rag;

import com.application.chatzy_backend.rag.dto.AnswerResponse;
import com.application.chatzy_backend.rag.dto.DocumentInfo;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RAGService {
    DocumentInfo ingest(MultipartFile file) throws Exception;
    List<DocumentInfo> listDocuments();
    boolean deleteDocument(String documentId);
    AnswerResponse answer(String question, Integer topKPerPart) throws Exception;
}
