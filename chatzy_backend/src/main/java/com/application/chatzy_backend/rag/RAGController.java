package com.application.chatzy_backend.rag;

import com.application.chatzy_backend.rag.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping
public class RAGController {
    
    private final RAGService ragService;
    private final TextEnhancerService textEnhancerService;
    
    public RAGController(RAGService ragService, TextEnhancerService textEnhancerService) {
        this.ragService = ragService;
        this.textEnhancerService = textEnhancerService;
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok().body(new HealthResponse("ok"));
    }
    
    @PostMapping("/v1/documents")
    public ResponseEntity<UploadResponse> uploadDocuments(@RequestParam("files") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            List<DocumentInfo> documents = files.stream()
                .map(file -> {
                    try {
                        return ragService.ingest(file);
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                })
                .toList();
            
            return ResponseEntity.status(HttpStatus.CREATED).body(new UploadResponse(documents));
        } catch (RuntimeException e) {
            if (e.getCause() instanceof IllegalArgumentException) {
                return ResponseEntity.badRequest().build();
            }
            throw e;
        }
    }
    
    @GetMapping("/v1/documents")
    public ResponseEntity<List<DocumentInfo>> listDocuments() {
        return ResponseEntity.ok(ragService.listDocuments());
    }
    
    @DeleteMapping("/v1/documents/{document_id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable("document_id") String documentId) {
        boolean deleted = ragService.deleteDocument(documentId);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/v1/questions")
    public ResponseEntity<AnswerResponse> askQuestion(@RequestBody QuestionRequest request) {
        try {
            AnswerResponse response = ragService.answer(request.getQuestion(), request.getTopKPerPart());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
    
    @PostMapping("/v1/text/enhance")
    public ResponseEntity<EnhanceTextResponse> enhanceText(@RequestBody EnhanceTextRequest request) {
        String enhancedText = textEnhancerService.enhanceText(request.getText());
        return ResponseEntity.ok(new EnhanceTextResponse(enhancedText));
    }
    
    private record HealthResponse(String status) {}
}
