package com.application.chatzy_backend.usercontacts.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddContactRequest {
    private String contactName;
    private String contactEmail;
    private String contactPhone;
}
