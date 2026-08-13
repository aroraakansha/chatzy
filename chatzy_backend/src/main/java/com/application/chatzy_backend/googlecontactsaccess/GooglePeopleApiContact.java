package com.application.chatzy_backend.googlecontactsaccess;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GooglePeopleApiContact {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String BASE_URL =
            "https://people.googleapis.com/v1/people/me/connections" +
                    "?personFields=names,emailAddresses,phoneNumbers&pageSize=200";

    public List<GoogleContactDto> fetchContacts(String accessToken) {
        List<GoogleContactDto> results = new ArrayList<>();
        String url = BASE_URL;

        while (url != null) {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response =
                    restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            JsonNode root;
            try {
                root = objectMapper.readTree(response.getBody());
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse Google People API response", e);
            }

            for (JsonNode person : root.path("connections")) {
                String name = person.path("names").isEmpty()
                        ? "Unknown"
                        : person.path("names").get(0).path("displayName").asText("Unknown");

                String email = person.path("emailAddresses").isEmpty()
                        ? null
                        : person.path("emailAddresses").get(0).path("value").asText(null);

                String phone = person.path("phoneNumbers").isEmpty()
                        ? null
                        : person.path("phoneNumbers").get(0).path("value").asText(null);

                if (email != null || phone != null) {
                    results.add(new GoogleContactDto(name, email, phone));
                }
            }

            JsonNode nextPageToken = root.path("nextPageToken");
            url = nextPageToken.isMissingNode()
                    ? null
                    : BASE_URL + "&pageToken=" + nextPageToken.asText();
        }

        return results;
    }
}
