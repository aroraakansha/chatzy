package com.application.chatzy_backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Data
@Configuration
@ConfigurationProperties(prefix = "webrtc")
public class WebRtcConfig {
    
    private List<IceServer> iceServers;
    
    @Data
    public static class IceServer {
        private List<String> urls;
        private String username;
        private String credential;
    }
}
