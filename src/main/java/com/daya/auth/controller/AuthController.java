package com.daya.auth.controller;

import com.daya.auth.model.AuthRequest;
import com.daya.auth.model.AuthResponse;
import com.daya.auth.service.JwtService;
import com.daya.auth.service.UserLookupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Issues JWT tokens for authenticated sessions")
public class AuthController {

    private final JwtService jwtService;
    private final UserLookupService userLookupService;

    @Operation(
            summary = "Generate JWT token",
            description = "Accepts a userId, looks up user details, and returns a signed JWT for use in API calls",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AuthRequest.class),
                            examples = @ExampleObject(value = "{\"userId\": \"12345\"}")
                    )
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "JWT issued successfully",
                            content = @Content(schema = @Schema(implementation = AuthResponse.class))),
                    @ApiResponse(responseCode = "400", description = "Missing or invalid request body")
            }
    )
    @PostMapping("/token")
    public ResponseEntity<AuthResponse> token(@RequestBody AuthRequest request) {
        var claims = userLookupService.getClaimsForUser(request.getUserId());
        return ResponseEntity.ok(new AuthResponse(
                jwtService.generateToken(request.getUserId(), claims)
        ));
    }
}